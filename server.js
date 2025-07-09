const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create raw HTTP server
const server = http.createServer(app);

// --- TEXT CHAT via WebSocket (manually upgraded on /ws) ---
const wss = new WebSocket.Server({ noServer: true }); // Don't auto-attach to server
const clients = new Set();


wss.on('connection', (ws) => {
  console.log('✅ New WebSocket (text chat) client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    const text = message.toString();
    console.log('Broadcasting message:', text);
    ws.send(text);

    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});
// --- VOICE CHAT via Socket.IO ---
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔊 New Socket.IO (voice chat) user connected');

  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO user disconnected');
  });
});

// --- Custom Upgrade Handler for WebSocket ---
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});


// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
