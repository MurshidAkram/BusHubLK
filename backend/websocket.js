const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your frontend URL
      methods: ["GET", "POST"]
    }
  });

  // Middleware to authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token.'));
      }
      socket.user = decoded; // Attach user info (userId, role) to the socket
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ WebSocket user connected: ${socket.user.userId} with role ${socket.user.role}`);

    // Join a room specific to the user's ID to receive private messages
    socket.join(socket.user.userId.toString());

    // --- Handle incoming messages ---
    socket.on('sendMessage', (data) => {
      const { conversationId, recipientId, text } = data;
      console.log(`Message from ${socket.user.userId} to ${recipientId}: ${text}`);
      
      const messagePayload = {
        senderId: socket.user.userId,
        conversationId,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // TODO: Save message to the database here
      
      // Emit the message to the recipient's private room
      io.to(recipientId.toString()).emit('receiveMessage', messagePayload);
      // Also send it back to the sender to confirm it was sent
      socket.emit('receiveMessage', messagePayload);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket user disconnected: ${socket.user.userId}`);
    });
  });

  return io;
}

module.exports = setupWebSocket;
