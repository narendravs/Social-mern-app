const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
const multer = require("multer");
const morgon = require("morgan");
const authRoot = require("./roots/auth");
const authPosts = require("./roots/posts");
const authUser = require("./roots/user");
const path = require("path");

dotenv.config();
const app = express();

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgon("common"));

//mongoose connection
mongoose.connect(
  "mongodb+srv://narenn185:narenn185@cluster0.scjwvwq.mongodb.net/socialapp?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);

//test the connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log(" Mongoose Connected successfully");
});

app.use("/images", express.static(path.join(__dirname, "public/images")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

app.use("/api/auth", authRoot);
app.use("/api/posts", authPosts);
app.use("/api/users", authUser);

app.listen("8000", () => {
  console.log("API Server running...");
});
