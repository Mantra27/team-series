const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const PORT = 5001;

// Enable CORS for 'http://localhost:5173'
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['my-custom-header'],
  credentials: true
}));

io.on('connection', (socket:any) => {
  console.log('A user connected');

  // Your socket.io event handlers here...

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const socketInit = () => {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

module.exports = { socketInit };
export {}