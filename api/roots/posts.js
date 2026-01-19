const express = require("express");
const { z } = require("zod");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Post = require("../models/posts");
const User = require("../models/user");
const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/asyncHandler");

// Validation schemas
const createPostSchema = z.object({
  desc: z.string().max(500).optional(),
  img: z.string().url().optional().or(z.string().max(0)),
});

const updatePostSchema = z.object({
  desc: z.string().max(500).optional(),
  img: z.string().url().optional().or(z.string().max(0)),
});

// Validation middleware helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors.array(),
      },
    });
  }
  next();
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#x27;");
};

//create post
router.post(
  "/",
  auth,
  [
    body("desc").optional().isString().isLength({ max: 500 }),
    body("img").optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const sanitizedBody = {
      desc: sanitizeInput(req.body.desc) || "",
      img: req.body.img || "",
      userId: req.user.id,
    };

    const newPost = new Post(sanitizedBody);
    const savedPost = await newPost.save();

    // Increment user post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: 1 } });

    res.status(201).json(savedPost);
  })
);

//update post
router.put(
  "/:id",
  auth,
  [
    body("desc").optional().isString().isLength({ max: 500 }),
    body("img").optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Post not found" } });
    }

    if (post.userId !== req.user.id) {
      return res
        .status(403)
        .json({
          error: { code: "FORBIDDEN", message: "You can't update this post" },
        });
    }

    const sanitizedBody = {
      desc: req.body.desc ? sanitizeInput(req.body.desc) : post.desc,
      img: req.body.img || post.img,
    };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedBody },
      { new: true }
    );

    res.status(200).json(updatedPost);
  })
);

//delete the post
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Post not found" } });
    }

    if (post.userId !== req.user.id && !req.user.roles.includes("admin")) {
      return res
        .status(403)
        .json({
          error: { code: "FORBIDDEN", message: "You can't delete this post" },
        });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Decrement user post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postCount: -1 } });

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  })
);

//like / dislike a post
router.put(
  "/:id/like",
  auth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Post not found" } });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId },
        $inc: { likeCount: -1 },
      });
      res
        .status(200)
        .json({ success: true, message: "Post unliked", liked: false });
    } else {
      await Post.findByIdAndUpdate(req.params.id, {
        $push: { likes: userId },
        $inc: { likeCount: 1 },
      });
      res
        .status(200)
        .json({ success: true, message: "Post liked", liked: true });
    }
  })
);

//get timeline posts with pagination
router.get(
  "/timeline/:userId",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.params.userId);

    if (!currentUser) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const userPosts = await Post.find({ userId: currentUser._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const friendPosts = await Promise.all(
      currentUser.followings.slice(skip, skip + limit).map((friendId) => {
        return Post.find({ userId: friendId })
          .sort({ createdAt: -1 })
          .limit(limit);
      })
    );

    const allPosts = userPosts.concat(...friendPosts);
    const totalPosts = await Post.countDocuments({
      $or: [
        { userId: currentUser._id },
        { userId: { $in: currentUser.followings } },
      ],
    });

    res.status(200).json({
      posts: allPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasMore: skip + limit < totalPosts,
      },
    });
  })
);

//get user's all posts with pagination
router.get(
  "/profile/:username",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const posts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId: user._id });

    res.status(200).json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasMore: skip + limit < totalPosts,
      },
    });
  })
);

//get single post
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Post not found" } });
    }

    res.status(200).json(post);
  })
);

module.exports = router;
