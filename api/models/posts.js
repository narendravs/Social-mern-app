const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    desc: {
      type: String,
      maxlength: 500,
      default: "",
    },
    img: {
      type: String,
      default: "",
    },
    likes: {
      type: [String], // keep compatibility
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Sort/index on createdAt for timelines and pagination
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);
