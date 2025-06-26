const express = require('express');
const { OpenAIApi } = require('openai');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const app = express();


// For unauthenticated users (based on IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs

  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many messages sent. Please wait a minute before trying again.'
    });
  }
});

// Load environment variables
dotenv.config();

app.set('trust proxy', 1);

const port = process.env.PORT || 5000;

// Authentication middleware
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    //return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
    return res.status(401).send('Authentication required.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (username === validUsername && password === validPassword) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic');
  //return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
  return res.status(401).send('Invalid credentials.');
};


// Middleware
app.use(cors());
app.use(express.json());

//Attempting to create a server for WebSocket Support.
const server = http.createServer(app);  // use HTTP server for WebSocket
const wss = new WebSocket.Server({ server });


// Trying to serve 40x.shtml errors
app.use(express.static('public'));

// Simple chat broadcast
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', (message) => {
    const text = message.toString(); // Explicitly convert buffer to string
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text); // Send as plain text
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});



// Configure OpenAI
const OpenAI = require('openai');

// Gets API from enviromental variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the /api/chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { userMessage, context } = req.body; // Expecting userMessage and context from the frontend
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Get API key from environment variable

  // Basic validation
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error: OpenAI API key missing." });
  }
  if (!userMessage) {
    return res.status(400).json({ error: "User message is required." });
  }

  console.log("Received message from frontend:", userMessage);

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Or "gpt-4" if you have access and prefer
        messages: [
          { role: "system", content: context }, // System context
          { role: "user", content: userMessage } // User's actual message
        ]
      })
    });

    const data = await openaiResponse.json();

    // Check for errors from OpenAI
    if (data.error) {
      console.error("Error from OpenAI API:", data.error.message);
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.";

    // Send the bot's reply back to the frontend
    res.json({ reply: botReply });

  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


// Route to handle file download
app.get('/download/bankroll_manager', (req, res) => {
  const filePath = path.join(__dirname, 'private_files', 'bankroll_manager.exe');
  res.download(filePath, 'bankroll_manager.exe', (err) => {
    if (err) {
      console.error('Error during file download:', err);
      res.status(500).send('An error occurred while downloading the file.');
    }
  });
});


// Route to handle resume download
app.get('/download/resume', auth, (req, res) => {
  const filePath = path.join(__dirname, 'private_files', 'resume.pdf');
  res.download(filePath, 'resume.pdf', (err) => {
    if (err) {
      res.status(500).send('Error downloading the file.');
    }
  });
});

// Custom 401 handler
app.get('/private', (req, res) => {
  const loggedIn = false;
  if (!loggedIn) {
    return res.status(401).sendFile(path.join(__dirname, 'public', '401.shtml'));
  }
  res.send('Private content');
});

// Custom 403 handler
app.get('/admin', (req, res) => {
  const isAdmin = false;
  if (!isAdmin) {
    return res.status(403).sendFile(path.join(__dirname, 'public', '403.shtml'));
  }
  res.send('Admin panel');
});

// Catch-all 404 (must be last)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.shtml'));
});



// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});