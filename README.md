# Real-Time Text & Voice Chat Application

## 🚀 Live Demo
**[Try the Chat App](https://andersonlabs.dev/portfolio.html#chat-app)**

## 📝 Description
A full-featured real-time communication platform supporting both text messaging and voice chat. Built with WebSockets for instant message delivery and WebRTC for peer-to-peer voice connections.

## 🛠️ Tech Stack
**Frontend:**
- HTML5, CSS3, JavaScript
- Socket.IO Client
- WebRTC for voice chat

**Backend:**
- Node.js / Express
- Socket.IO for real-time communication
- Deployed on Render

**Database:**
- Supabase (PostgreSQL)

## ✨ Features
- ✅ Real-time text messaging with multiple users
- ✅ Voice chat with join/leave controls
- ✅ User agreement system with Terms of Use
- ✅ Message history persistence
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and connection indicators

## 🎯 Challenges & Solutions

**Challenge:** Implementing real-time bidirectional communication  
**Solution:** Integrated Socket.IO for WebSocket connections, enabling instant message delivery across all connected clients

**Challenge:** Adding voice chat to existing text chat  
**Solution:** Implemented WebRTC for peer-to-peer audio streaming with simple join/leave controls

**Challenge:** Managing connection states  
**Solution:** Created custom loading animations and connection indicators to provide clear user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000
```

4. Start the server
```bash
npm start
```

5. Open `http://localhost:3000` in your browser

## 📦 Dependencies
```json
{
  "socket.io": "^4.x",
  "express": "^4.x",
  "@supabase/supabase-js": "^2.x"
}
```

## 🔐 Environment Variables
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase API key |
| `PORT` | Server port (default: 3000) |

## 📸 Screenshots
[Add screenshots here when ready]

## 🤝 Contributing
This is a portfolio project, but feedback is welcome! Feel free to open an issue.

## 📄 License
MIT License - feel free to use this code for learning purposes

## 👤 Author
**Anderson Santana**
- Portfolio: [andersonlabs.dev](https://andersonlabs.dev)
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---
⭐ If you found this project interesting, please give it a star!