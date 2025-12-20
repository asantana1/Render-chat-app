function appendSystemMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.className = 'message system';
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function stopAllMediaStreams() {
  // Stop the main local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
    // Also stop any other streams attached to audio elements
  document.querySelectorAll('audio').forEach(audio => {
    if (audio.srcObject) {
      audio.srcObject.getTracks().forEach(track => track.stop());
      audio.srcObject = null;
    }
  });
}

// Connect to the Socket.IO server for signaling

//const socket = io('https://render-chat-app-buzi.onrender.com');

const VOICE_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"     // local server
  : "https://render-chat-app-buzi.onrender.com"; // production

const socket = io(VOICE_URL);

const voiceLoader = document.querySelector('.voiceLoader');


// Built-in Socket.IO connection event (no data passed)
socket.on('connect', () => {

  console.log('✅ Socket.IO client connected, id:', socket.id);

  // Fade out voice loader
  voiceLoader.classList.add('hidden');
  // Optionally remove from DOM after transition
  setTimeout(() => voiceLoader.remove(), 2500);
  
});

// Custom event from your server with the welcome message
socket.on('connected', (data) => {
  const chatBox = document.getElementById('chat-box');
  const msg = document.createElement('div');
  msg.className = 'message system';
  msg.textContent = data.message;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

document.querySelectorAll('audio').forEach(a => a.remove());

let localStream = null;
let peerConnection = null;
let joinedVoice = false

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

document.getElementById('joinBtn').onclick = async () => {
  if (joinedVoice) return;
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    appendSystemMessage('🟢 Voice chat started');

    // Optional: play your own mic locally (muted so you don't hear yourself)
    const localAudio = document.createElement('audio');
    localAudio.srcObject = localStream;
    localAudio.autoplay = true;
    localAudio.muted = true;
    document.body.appendChild(localAudio);

    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      const remoteAudio = document.createElement('audio');
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      document.body.appendChild(remoteAudio);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);

    joinedVoice = true;
  } catch (err) {
    console.error('🎤 Microphone error:', err);
    alert('Microphone access is required to join voice chat.');
  }
};

socket.on('offer', async (offer) => {
  try {
    
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      const remoteAudio = document.createElement('audio');
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      document.body.appendChild(remoteAudio);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
  } catch (err) {
    console.error('Error handling offer:', err);
  }
});

socket.on('answer', async (answer) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

socket.on('ice-candidate', async (candidate) => {
  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding received ICE candidate', err);
    }
  }
});

document.getElementById('leaveBtn').onclick = () => {
    
  if (!joinedVoice) return;
  
  // Remove all audio elements to clean up remote/local audio
  document.querySelectorAll('audio').forEach(a => a.remove());

  // Stop all media streams safely
  stopAllMediaStreams();
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  appendSystemMessage('🔴 Left voice chat');
  joinedVoice = false;
};
