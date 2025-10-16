const jwt = require('jsonwebtoken');
const Communication = require('../models/communicationModel');

const setupSocketIO = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user's channels
    socket.on('join_channels', async () => {
      try {
        const channels = await Communication.getUserChannels(socket.userId);
        channels.forEach(channel => {
          socket.join(`channel_${channel.channel_id}`);
        });
        console.log(`User ${socket.userId} joined ${channels.length} channels`);
      } catch (error) {
        console.error('Error joining channels:', error);
      }
    });

    // Handle joining a specific channel
    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
      console.log(`User ${socket.userId} joined channel ${channelId}`);
    });

    // Handle leaving a channel
    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
      console.log(`User ${socket.userId} left channel ${channelId}`);
    });

    // Handle typing indicator
    socket.on('typing_start', ({ channelId }) => {
      socket.to(`channel_${channelId}`).emit('user_typing', {
        userId: socket.userId,
        channelId
      });
    });

    socket.on('typing_stop', ({ channelId }) => {
      socket.to(`channel_${channelId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        channelId
      });
    });

    // Handle message read status
    socket.on('message_read', async ({ messageId, channelId }) => {
      try {
        await Communication.markMessageAsRead(messageId, socket.userId);
        socket.to(`channel_${channelId}`).emit('message_read_update', {
          messageId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

module.exports = setupSocketIO;