const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track all clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ New WebSocket client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    const text = message.toString(); // Explicitly convert buffer to string
    console.log('Broadcasting message:', text);
    ws.send(text);

    // Broadcast to others
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  ws.on('close', () => {
     clients.delete(ws);
     console.log('Client disconnected');
  });
});


// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
