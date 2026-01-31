const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const dotenv = require("dotenv");
dotenv.config();

// 1. Initialize Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    keepAlive: 5000,
    connectTimeout: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on("error", (err) => console.error("❌ Redis Client Error", err));

// Self-invoking function to connect to Redis
(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✓ Connected to Upstash Redis");
  }
})();

/**
 * Initialize socket.io handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocket = async (io) => {
  try {
    // 2. Create and Connect the Subscriber Client
    // (The adapter REQUIRES a duplicate client for Pub/Sub)
    const subClient = redisClient.duplicate();
    await subClient.connect();
    console.log("✓ Redis Sub Client Connected");

    // 3. Attach the Adapter to Socket.io
    io.adapter(createAdapter(redisClient, subClient));
    console.log("✓ Socket.io Redis Adapter Initialized");

    // 4. Authentication middleware for sockets
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

    io.on("connection", async (socket) => {
      socket.on("connect_error", (err) => {
        console.error(`Connect Error: ${err.message}`);
      });
      console.log(`🔌 User connected: ${socket.id}`);

      // 5. Track Online Status in Redis
      if (socket.userId) {
        console.log(`User ${socket.userId} joined room: user:${socket.userId}`);
        // Store socketId in a Set for this user
        await redisClient.sAdd(`online_users:${socket.userId}`, socket.id);
        socket.join(`user:${socket.userId}`);

        // Broadcast user is online
        socket.broadcast.emit("user:online", { userId: socket.userId });
      }

      //6. Listen for notifications from the client
      socket.on(
        "sendNotification",
        handleError(socket, ({ receiverId, type }) => {
          console.log("Notification Payload Received:", receiverId, type);
          const notificationData = {
            senderName: socket.username || "Someone", // Ensure you store username in middleware
            type: type,
          };

          if (type === "newPost") {
            // Use broadcast.emit so the sender doesn't get a notification for their own post
            socket.broadcast.emit("getNotification", notificationData);
          } else {
            // Use your existing sendNotification helper
            sendNotification(
              io,
              receiverId,
              "getNotification",
              notificationData,
            );
          }
        }),
      );

      // 7. Cleanup on Disconnect
      socket.on("disconnect", async () => {
        if (socket.userId) {
          // Remove this specific socket from the user's Set
          await redisClient.sRem(`online_users:${socket.userId}`, socket.id);

          // Check if user has NO more active sockets (tabs) open
          const remainingSockets = await redisClient.sCard(
            `online_users:${socket.userId}`,
          );
          if (remainingSockets === 0) {
            await redisClient.del(`online_users:${socket.userId}`); // Delete the empty Set
            socket.broadcast.emit("user:offline", { userId: socket.userId });
          }
        }
        console.log(`🔌 Disconnected: ${socket.id}`);
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
        socket
          .to(`conversation:${conversationId}`)
          .emit("user:stopped-typing", {
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
  } catch (err) {
    console.error("❌ Redis/Socket Adapter Error:", err);
  }
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
// const isUserOnline = (userId) => {
//   return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
// };

// 4. Helper function to check online status (Async!)
const isUserOnline = async (userId) => {
  const count = await redisClient.sCard(`online_users:${userId}`);
  return count > 0;
};

module.exports = {
  initializeSocket,
  sendNotification,
  broadcast,
  isUserOnline,
};
