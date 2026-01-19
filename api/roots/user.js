const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/posts");
const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/asyncHandler");

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  desc: z.string().max(160).optional(),
  city: z.string().max(50).optional(),
  from: z.string().max(50).optional(),
  relationship: z.number().int().min(1).max(3).optional(),
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

//get user
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    res.status(200).json(user);
  })
);

//get user by username
router.get(
  "/username/:username",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    res.status(200).json(user);
  })
);

//update user
router.put(
  "/:id",
  auth,
  [
    body("username").optional().isString().isLength({ min: 3, max: 20 }),
    body("email").optional().isEmail(),
    body("desc").optional().isString().isLength({ max: 160 }),
    body("city").optional().isString().isLength({ max: 50 }),
    body("from").optional().isString().isLength({ max: 50 }),
    body("relationship").optional().isInt({ min: 1, max: 3 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user.id && !req.user.roles.includes("admin")) {
      return res
        .status(403)
        .json({
          error: {
            code: "FORBIDDEN",
            message: "You can't update this profile",
          },
        });
    }

    const sanitizedBody = {
      username: req.body.username
        ? sanitizeInput(req.body.username)
        : undefined,
      email: req.body.email,
      desc: req.body.desc ? sanitizeInput(req.body.desc) : undefined,
      city: req.body.city ? sanitizeInput(req.body.city) : undefined,
      from: req.body.from ? sanitizeInput(req.body.from) : undefined,
      relationship: req.body.relationship,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedBody },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  })
);

//follow a user
router.put(
  "/:id/follow",
  auth,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({
          error: { code: "BAD_REQUEST", message: "You can't follow yourself" },
        });
    }

    const currentUser = await User.findById(req.user.id);
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    if (!currentUser.followings.includes(req.params.id)) {
      await currentUser.updateOne({
        $push: { followings: req.params.id },
        $inc: { followingsCount: 1 },
      });

      await userToFollow.updateOne({
        $push: { followers: req.user.id },
        $inc: { followersCount: 1 },
      });

      res
        .status(200)
        .json({
          success: true,
          message: `You are now following ${userToFollow.username}`,
        });
    } else {
      res
        .status(400)
        .json({
          error: {
            code: "BAD_REQUEST",
            message: "You already follow this user",
          },
        });
    }
  })
);

//unfollow a user
router.put(
  "/:id/unfollow",
  auth,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({
          error: {
            code: "BAD_REQUEST",
            message: "You can't unfollow yourself",
          },
        });
    }

    const currentUser = await User.findById(req.user.id);
    const userToUnfollow = await User.findById(req.params.id);

    if (!userToUnfollow) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    if (currentUser.followings.includes(req.params.id)) {
      await currentUser.updateOne({
        $pull: { followings: req.params.id },
        $inc: { followingsCount: -1 },
      });

      await userToUnfollow.updateOne({
        $pull: { followers: req.user.id },
        $inc: { followersCount: -1 },
      });

      res
        .status(200)
        .json({
          success: true,
          message: `You unfollowed ${userToUnfollow.username}`,
        });
    } else {
      res
        .status(400)
        .json({
          error: { code: "BAD_REQUEST", message: "You don't follow this user" },
        });
    }
  })
);

//search users
router.get(
  "/search/:query",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = new RegExp(req.params.query, "i"); // Case-insensitive search

    const users = await User.find({
      $or: [{ username: query }, { email: query }],
    })
      .select("-password")
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({
      $or: [{ username: query }, { email: query }],
    });

    res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasMore: skip + limit < totalUsers,
      },
    });
  })
);

//get user followers
router.get(
  "/:id/followers",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const followers = await User.find({ _id: { $in: user.followers } })
      .select("-password")
      .skip(skip)
      .limit(limit);

    res.status(200).json({ followers, total: user.followers.length });
  })
);

//get user followings
router.get(
  "/:id/followings",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    const followings = await User.find({ _id: { $in: user.followings } })
      .select("-password")
      .skip(skip)
      .limit(limit);

    res.status(200).json({ followings, total: user.followings.length });
  })
);

module.exports = router;
