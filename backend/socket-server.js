const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`[Socket.IO] Client connected. Total clients: ${connectedClients}`);

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`[Socket.IO] Client disconnected. Total clients: ${connectedClients}`);
  });

  socket.on('subscribe-notifications', () => {
    socket.join('notifications');
    console.log('[Socket.IO] Client subscribed to notifications');
  });
});

app.post('/broadcast/new-application', (req, res) => {
  const applicationData = req.body;
  
  console.log('[Socket.IO] Broadcasting new application:', applicationData);
  
  io.to('notifications').emit('new-application', applicationData);
  
  res.json({ success: true, message: 'Notification broadcasted' });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    connectedClients,
    uptime: process.uptime()
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
  console.log(`[Socket.IO] Broadcasting endpoint: http://127.0.0.1:${PORT}/broadcast/new-application`);
});
