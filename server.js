const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const fs = require('fs');
const path = require('path');
@@ -8,30 +7,17 @@ dotenv.config();

const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { OpenAIApi } = require('openai');
const bcrypt = require('bcrypt'); // For hashing passwords
const bodyParser = require('body-parser');
const pool = require('./db'); //MySQL pool
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");

// 3. Initialize supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const app = express();


// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// For unauthenticated users (based on IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
@@ -47,445 +33,18 @@ const chatLimiter = rateLimit({
  }
});


app.set('trust proxy', 1);

const port = process.env.PORT || 5000;

// Supabase Auth
function supabaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No Authorization header" });

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


// Protect your admin dashboard route
/*app.get('/admin', supabaseAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});*/

// Or protect API routes
/*app.get('/api/contacts', supabaseAuth, async (req, res) => {
  const { data, error } = await supabase.from('contacts').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});*/


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


// ============================================
// REACT APP
// ============================================
app.use('/portfolio', express.static(path.join(__dirname, 'react-portfolio/dist')));

// ============================================
// DASHBOARD API ROUTES 
// ============================================
// Get all contacts
app.get('/api/contacts', supabaseAuth, async (req, res) => {
  const { data, error } = await supabase.from('contact_messages').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update contact status
app.put('/api/contacts/:id/status', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// Serves all HTML/CSS/JS files
app.use(express.static('public'));

// Configure OpenAI
const OpenAI = require('openai');

// Gets API from enviromental variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // e.g., mail.andersonlabs.dev
  port: process.env.SMTP_PORT,        // Usually 587 or 465
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,      // anderson@andersonlabs.dev
    pass: process.env.SMTP_PASS       // Your email password
  },
  // Add these for better reliability
  tls: {
    rejectUnauthorized: false // Use with caution, only if needed
  }
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ============================================
// ROUTES
// ============================================

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json({
    message: "Login successful",
    access_token: data.session.access_token,
    user: data.user
  });
});

/* Route for contact form (saves to Supabase "contact_messages" table) 
   and Email sending Route. */
   
  
// Fallback to index.html for React routing (so client-side routes work)
/*app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminDistPath, 'index.html'));
});*/


// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate input
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // VALIDATE EMAIL FORMAT
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Please enter a valid email address.' });
}
  try {
    // 3. SAVE TO DATABASE
    const { data, error } = await supabase
      .from("contact_messages")
      .insert([{
        name, 
        email, 
        subject, 
        message, 
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      
      // Detect duplicate email (PostgreSQL unique violation)
      if (error.code === "23505" || error.message.includes("duplicate key value")) {
        return res.status(409).json({ error: "This email has already been used." });
      }

      // Other unexpected database errors
      return res.status(500).json({ error: "Database error: " + error.message });
    }

    console.log('✅ Message saved to database:', data[0]?.id);

    // 4. SEND EMAILS (only after successful database insert)
    
    // Email to YOU (admin notification)
    const adminMailOptions = {
      from: `"Anderson Labs Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: `"${name}" <${email}>`,
      subject: `🔔 New Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 10px 0;"><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0;">
              ${message}
            </p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            💡 Click "Reply" to respond directly to ${name}<br>
            📊 Database ID: ${data[0]?.id || 'N/A'}
          </p>
        </div>
      `
    };

    // Email to USER (confirmation)
    const userMailOptions = {
      from: `"Anderson Labs" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Thank you for contacting Anderson Labs!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
            Thank You for Reaching Out!
          </h2>
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="color: #555; line-height: 1.6;">
            Thank you for contacting Anderson Labs! We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0; color: #666;"><strong>Your message:</strong></p>
            <p style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0; color: #333;">
              ${message}
            </p>
          </div>
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>Anderson Labs Team</strong>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated confirmation. If you need immediate assistance, please reply to this email.
          </p>
        </div>
      `
    };

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    console.log(`✅ Emails sent successfully to ${email}`);
    
    // 5. SEND SUCCESS RESPONSE (only after everything succeeds)
    res.status(200).json({ 
      message: 'Your message has been received. Please check your email for confirmation.' 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    // More detailed error for debugging
    let errorMessage = 'Failed to process your message. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Serve React admin dashboard
const adminDistPath = path.join(__dirname, 'admin', 'dist');
app.use('/admin', express.static(adminDistPath));



// Define the /api/chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { userMessage, context } = req.body; // Expecting userMessage and context from the frontend
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if(!OPENAI_API_KEY){
      console.error('Missing API key');
      return res.status(500).json({ error: 'Server misconfiguration' });
  }
  if (!userMessage) {
    return res.status(400).json({ error: 'User message required' });
  }
    
  try {
    console.log('User says:', userMessage);
    
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
        
      const botReply = data.choices?.[0]?.message?.content ?? 'Sorry, no answer.';
      res.json({ reply: botReply }); // Respond to frontend
  
      // Log the exchange with timestamp and OpenAI usage info
      const entry = {
        timestamp: new Date().toISOString(),
        userMessage,
        botReply,
        usage: data.usage ?? null
      };
      const line = JSON.stringify(entry) + '\n';
      
      fs.appendFile(path.join(__dirname, 'chat_history.log'), line, 'utf8', err => {
        if (err) console.error('Log write error:', err);
      });
    
      } catch (err) {
        console.error('Chat handler error:', err);
        res.status(500).json({ error: 'Internal server error' });
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

// Route to handle PDF resume download
app.get('/download/resume/pdf', (req, res) => {
  const filePath = path.join(__dirname, 'private_files', 'resume.pdf');
  res.download(filePath, 'resume.pdf', (err) => {
    if (err) {
      res.status(500).send('Error downloading the file.');
    }
  });
});

// Route to handle Word resume download
app.get('/download/resume/docx', (req, res) => {
  const filePath = path.join(__dirname, 'private_files', 'resume.docx');
  res.download(filePath, 'resume.docx', (err) => {
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
/*app.get('/admin/*', (req, res) => {
  const isAdmin = false;
  if (!isAdmin) {
    return res.status(403).sendFile(path.join(__dirname, 'public', '403.shtml'));
  }
  res.send('Admin panel');
});*/

// Catch-all 404 (must be last)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.shtml'));
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
