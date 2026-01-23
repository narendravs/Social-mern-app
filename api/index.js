const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
const multer = require("multer");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// 1. Load Environment Variables First
dotenv.config();

// Routes
const authRoot = require("./roots/auth");
const authPosts = require("./roots/posts");
const authUser = require("./roots/user");

// Middlewares
const errorHandler = require("./middlewares/errorHandler");
const rateLimiter = require("./middlewares/rateLimiter");

// Utils
const { initializeSocket } = require("./utils/socket");

const app = express();
const httpServer = createServer(app);

//2. Socket.io setup for real-time features
// Updated Socket.io setup in index.js
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:6001",
    credentials: true,
  },
  // Add this for better stability on Render/Vercel environments
  transports: ["websocket", "polling"],
  allowEIO3: true, // Only if you have very old clients connecting
});

// Make io accessible to routes
app.set("io", io);

// Initialize socket handlers
initializeSocket(io);

// 3. General Middlewares (Security, Parsing, Logging)
// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:6001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

//4. Static files with proper headers
app.use("/images", express.static(path.join(__dirname, "public/images")));

// 5. Special Endpoints (Health, Upload, Favicon)
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Prevent 404 for favicon.ico
app.get("/favicon.ico", (req, res) => res.status(204).end());

//6. Swagger documentation setup
if (process.env.NODE_ENV !== "production") {
  const swaggerJsdoc = require("swagger-jsdoc");
  const swaggerUi = require("swagger-ui-express");

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "MERN Social API",
        version: "1.0.0",
        description: "A full-stack social media application API documentation",
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 5000}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["./roots/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

//7. API routes
app.use("/api/auth", authRoot);
app.use("/api/posts", authPosts);
app.use("/api/users", authUser);

//8. 404 Handler (MUST be after routes, before global error handler)
app.use((req, res) => {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// 9. Global Error Handler (MUST be the absolute last middleware)
app.use(errorHandler);

//10. MongoDB connection with better error handling
if (!process.env.MONGO_URL) {
  console.error(
    "✗ Fatal Error: MONGO_URL is not defined in environment variables.",
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URL, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas connections
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✓ MongoDB Connected successfully");
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    process.exit(1);
  });

//11. Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, io };
