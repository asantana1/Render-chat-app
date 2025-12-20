document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM Content Loaded');
  
  const WS_URL = window.location.hostname === "localhost"
  ? "ws://localhost:5000/ws"        // local WebSocket
  : "wss://render-chat-app-buzi.onrender.com/ws"; // production WebSocket

  const ws = new WebSocket(WS_URL);
  //const ws = new WebSocket('wss://render-chat-app-buzi.onrender.com/ws');

  const textLoader = document.querySelector('.textLoader');
  
  ws.addEventListener('open', () => {
    console.log('✅ WebSocket connection opened');
    // Fade out text loader
      textLoader.classList.add('hidden');
    // Optionally remove from DOM after transition
      setTimeout(() => textLoader.remove(), 2500);
    
    
  });
  
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input'); 
  const chatBox = document.getElementById('chat-box');
  
  
  if (!form || !input || !chatBox) {
    console.error('❌ Missing required elements:', { form, input, chatBox }); 
    return;
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg !== '') {
      console.log('📤 Sending message:', msg);    
      ws.send(msg);
      input.value = '';
    }
  });

  ws.addEventListener('message', (event) => {
    console.log('📩 Received message:', event.data);
    
    let messageText;
    let isSystem = false;

    try {
        const data = JSON.parse(event.data);
        if (data.type === 'connection') {
            messageText = data.message; // e.g. ✅ Connected to text chat server.
            isSystem = true; 
        } else {
            messageText = data.message || event.data; // fallback
        }
    } catch (err) {
      // Not JSON? Assume it's just a raw string message
      messageText = event.data;
    }

    const msg = document.createElement('div');
    msg.className = 'message' + (isSystem ? ' system' : ''); // Conditionally add .system
    msg.textContent = messageText;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
  });
  
  ws.addEventListener('error', (err) => {
    console.error('🚨 WebSocket error:', err);
  });

  ws.addEventListener('close', () => {
    console.warn('🔌 WebSocket connection closed');
  });
});
