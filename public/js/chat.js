const socket = new WebSocket(`ws://${location.host}`);

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg !== '') {
    socket.send(msg);
    input.value = '';
  }
});

socket.addEventListener('message', (event) => {
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.textContent = event.data;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});
