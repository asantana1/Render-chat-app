const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch'); // Add this dependency for fetch on Node.js

// Load environment variables
dotenv.config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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


// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
