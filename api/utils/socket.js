const jwt = require("jsonwebtoken");

// Store connected users: Map<userId, Set<socketId>>
const connectedUsers = new Map();

/**
 * Initialize socket.io handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Authentication middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      // Allow connection without token for guest features
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      socket.username = decoded.username; // Assuming username is in the token
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  /**
   * Utility to catch errors in async/sync socket events
   */
  const handleError = (socket, handler) => {
    return (...args) => {
      try {
        handler(...args);
      } catch (err) {
        console.error(`❌ Socket Error [${socket.id}]:`, err.message);
        socket.emit("error", { message: "Internal server error occurred." });
      }
    };
  };

  io.on("connection", (socket) => {
    socket.on("connect_error", (err) => {
      console.error(`Connect Error: ${err.message}`);
    });
    console.log(`🔌 User connected: ${socket.id}`);

    // Join user's personal room
    if (socket.userId) {
      if (!connectedUsers.has(socket.userId)) {
        connectedUsers.set(socket.userId, new Set());
      }
      connectedUsers.get(socket.userId).add(socket.id);
      socket.join(`user:${socket.userId}`);
      console.log(`👤 User ${socket.userId} joined their room`);
    }
    // Listen for notifications from the client
    socket.on(
      "sendNotification",
      handleError(socket, ({ receiverId, type }) => {
        const notificationData = {
          senderName: socket.username || "Someone", // Ensure you store username in middleware
          type: type,
        };

        if (type === "newPost") {
          // Use broadcast.emit so the sender doesn't get a notification for their own post
          socket.broadcast.emit("getNotification", notificationData);
        } else {
          // Use your existing sendNotification helper
          sendNotification(io, receiverId, "getNotification", notificationData);
        }
      }),
    );
    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.id}`);

      if (socket.userId && connectedUsers.has(socket.userId)) {
        connectedUsers.get(socket.userId).delete(socket.id);
        if (connectedUsers.get(socket.userId).size === 0) {
          connectedUsers.delete(socket.userId);
        }
      }
    });

    // Join a room (e.g., for notifications)
    socket.on("join:room", (room) => {
      socket.join(room);
      console.log(`📦 Socket ${socket.id} joined room: ${room}`);
    });

    // Leave a room
    socket.on("leave:room", (room) => {
      socket.leave(room);
      console.log(`📦 Socket ${socket.id} left room: ${room}`);
    });

    // Typing indicator
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("user:typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("user:stopped-typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Online status
    socket.on("status:online", () => {
      if (socket.userId) {
        socket.broadcast.emit("user:online", { userId: socket.userId });
      }
    });
  });

  // Periodic cleanup of disconnected sockets
  setInterval(() => {
    connectedUsers.forEach((sockets, userId) => {
      sockets.forEach((socketId) => {
        if (!io.sockets.sockets.get(socketId)) {
          sockets.delete(socketId);
        }
      });
      if (sockets.size === 0) {
        connectedUsers.delete(userId);
      }
    });
  }, 60000); // Every minute
};

/**
 * Send notification to a specific user
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - User ID to send notification to
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
const sendNotification = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Broadcast to all connected clients
 * @param {Server} io - Socket.io server instance
 * @param {string} event - Event name
 * @param {object} data - Data to send
 */
const broadcast = (io, event, data) => {
  io.emit(event, data);
};

/**
 * Check if a user is online
 * @param {string} userId - User ID to check
 * @returns {boolean} - Whether the user is online
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

module.exports = {
  initializeSocket,
  sendNotification,
  broadcast,
  isUserOnline,
  connectedUsers,
};
