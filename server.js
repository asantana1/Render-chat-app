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

// --- RATE LIMIT SETTINGS ---
const WS_RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const WS_MAX_MESSAGES_PER_WINDOW = 5;

const IO_RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const IO_MAX_EVENTS_PER_WINDOW = 20;

// --- TEXT CHAT via WebSocket (manually upgraded on /ws) ---
const wss = new WebSocket.Server({ noServer: true }); // Don't auto-attach to server
const clients = new Set();


wss.on('connection', (ws) => {
  console.log('✅ New WebSocket (text chat) client connected');
  clients.add(ws);

  // Track message timestamps for rate limiting
  ws.messageTimestamps = [];

  // Notify client
  ws.send(JSON.stringify({ type: 'connection', message: '✅ Connected to text chat server.' }));

  ws.on('message', (message) => {
    const now = Date.now();

    // Clean old timestamps
    ws.messageTimestamps = ws.messageTimestamps.filter(ts => now - ts < WS_RATE_LIMIT_WINDOW_MS);

    if (ws.messageTimestamps.length >= WS_MAX_MESSAGES_PER_WINDOW) {
      ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded. Please wait before sending more messages.' }));
      return;
    }

    const text = message.toString();
    console.log('Broadcasting message:', text);
    ws.send(text);

     ws.messageTimestamps.push(now);

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
    origin: 'https://andersonlabs.dev',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔊 New Socket.IO (voice chat) user connected');

  socket.messageTimestamps = [];
  
  // Notify the client
  socket.emit('connected', { message: '🔊 Connected to voice chat server.' });

  function canSend() {
    const now = Date.now();
    socket.messageTimestamps = socket.messageTimestamps.filter(ts => now - ts < IO_RATE_LIMIT_WINDOW_MS);
    return socket.messageTimestamps.length < IO_MAX_EVENTS_PER_WINDOW;
  }

  socket.on('offer', (data) => {
    if (!canSend()) {
      socket.emit('error', { message: 'Rate limit exceeded. Please wait.' });
      return;
    }
    socket.messageTimestamps.push(Date.now());
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    if (!canSend()) {
      socket.emit('error', { message: 'Rate limit exceeded. Please wait.' });
      return;
    }
    socket.messageTimestamps.push(Date.now());
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    if (!canSend()) {
      socket.emit('error', { message: 'Rate limit exceeded. Please wait.' });
      return;
    }
    socket.messageTimestamps.push(Date.now());
    socket.broadcast.emit('ice-candidate', data);
  });

  
  /*socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });*/

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
