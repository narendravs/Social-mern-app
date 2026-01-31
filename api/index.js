const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

// Routes & Utils
const { initializeSocket } = require("./utils/socket");
const authRoot = require("./roots/auth");
const authPosts = require("./roots/posts");
const authUser = require("./roots/user");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

// Validation
if (!process.env.MONGO_URL) {
  console.error("✗ Fatal Error: MONGO_URL is not defined.");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://social-mern-app-two.vercel.app",
  "http://localhost:8000",
];
// 1. Socket.io Configuration
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Policy: Origin not allowed"), false);
      }
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

app.set("io", io);

// 2. Security & Global Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Set false if using external CDNs frequently
  }),
);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS Policy: Origin not allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 3. Static Files & Health Checks
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.get("/api/health", (req, res) =>
  res.status(200).json({ status: "OK", uptime: process.uptime() }),
);
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 4. API Routes
app.use("/api/auth", authRoot);
app.use("/api/posts", authPosts);
app.use("/api/users", authUser);

// 5. Documentation (Development Only)
if (process.env.NODE_ENV !== "production") {
  const swaggerJsdoc = require("swagger-jsdoc");
  const swaggerUi = require("swagger-ui-express");
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: { title: "MERN Social API", version: "1.0.0" },
      servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }],
    },
    apis: ["./roots/*.js"],
  };
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerJsdoc(swaggerOptions)),
  );
}

// 6. Production Static Serving
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");
  // Only serve static files if the build directory exists
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
      if (!req.originalUrl.startsWith("/api")) {
        res.sendFile(path.join(buildPath, "index.html"));
      }
    });
  } else {
    console.warn(
      "⚠️ Frontend build folder not found. Running in API-only mode.",
    );
  }
}

// 7. Error Handling (Must be last)
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

// 8. Server Startup Logic
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✓ MongoDB Connected");

    await initializeSocket(io);
    console.log("✓ Socket/Redis Ready");

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  } catch (err) {
    console.error("✗ Startup Failed:", err);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on("SIGTERM", () => {
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log("Cleanup complete, exiting.");
      process.exit(0);
    });
  });
});

startServer();

module.exports = { app };
