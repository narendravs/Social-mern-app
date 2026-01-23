const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/posts");
const auth = require("../middlewares/auth");
const asyncHandler = require("../middlewares/asyncHandler");
const { uploadProfile } = require("../middlewares/uploadImages");
const uploadToCloudinary = require("../middlewares/cloudinaryUpload");

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  desc: z.string().max(160).optional(),
  city: z.string().max(50).optional(),
  from: z.string().max(50).optional(),
  relationship: z.enum(["Single", "Married", "Unmarried"]).optional(),
  profilePicture: z.string().optional(),
  coverPicture: z.string().optional(),
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
  }),
);

//get friends
router.get(
  "/friends/:id",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    // The frontend expects an array of full user objects for the friends list.
    const friendIds = user.friends.map((f) => f.userId);
    const friendsList = await User.find({ _id: { $in: friendIds } }).select(
      "-password",
    );
    res.status(200).json(friendsList);
  }),
);

//add friends
router.put(
  "/add-friends",
  auth,
  asyncHandler(async (req, res) => {
    const { friendDetails } = req.body;
    if (!friendDetails) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Missing friend details" },
      });
    }

    const userId = req.user.id || req.user.sub;
    const targetId = friendDetails._id || friendDetails.userId;
    if (!targetId || !friendDetails.username) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid friend data" },
      });
    }

    // Find the user to ensure they exist and are not already friends
    const user = await User.findById(userId).select("friends");
    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    if (user.friends.some((f) => f.userId.toString() === targetId.toString())) {
      return res.status(400).json({
        error: { code: "DUPLICATE", message: "User is already a friend" },
      });
    }

    const addDetails = {
      userId: targetId,
      username: friendDetails.username,
      profilePicture: friendDetails.profilePicture || "",
    };

    // Atomically update the user's friends list using $push.
    // This avoids loading/saving the full document, which was triggering a validation
    // error on an unrelated 'relationship' field due to pre-existing bad data.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { friends: addDetails } },
      // runValidators is good practice to ensure the subdocument is valid
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User could not be updated." },
      });
    }

    res.status(200).json(updatedUser);
  }),
);

//remove friends
router.put(
  "/remove-friends",
  auth,
  asyncHandler(async (req, res) => {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Missing friend ID" },
      });
    }

    const userId = req.user.id || req.user.sub;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: { userId: friendId } } },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    res.status(200).json(updatedUser);
  }),
);

//get users
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    // Return all users, excluding the current user making the request.
    const userId = req.user.id || req.user.sub;
    const usersQuery = User.find({ _id: { $ne: userId } });
    const totalUsers = await User.countDocuments(usersQuery.getFilter());
    const users = await usersQuery
      .select(["username", "profilePicture"])
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users,
      pagination: {
        hasMore: skip + users.length < totalUsers,
      },
    });
  }),
);

//get user by username
router.get(
  "/username/:username",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    res.status(200).json(user);
  }),
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
    body("relationship").optional().isIn(["Single", "Married", "Unmarried"]),
    body("profilePicture").optional().isString(),
    body("coverPicture").optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.sub;
    if (req.params.id !== userId && !req.user.roles.includes("admin")) {
      return res.status(403).json({
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
      profilePicture: req.body.profilePicture,
      coverPicture: req.body.coverPicture,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedBody },
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json(updatedUser);
  }),
);

//follow a user
router.put(
  "/:id/follow",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.sub;
    if (req.params.id === userId) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "You can't follow yourself" },
      });
    }
    console.log("Current User ID from Auth:", userId);
    const currentUser = await User.findById(userId);
    const userToFollow = await User.findById(req.params.id);

    if (!currentUser || !userToFollow) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    if (!currentUser.followings.includes(req.params.id)) {
      await currentUser.updateOne({
        $push: { followings: req.params.id },
        $set: { followingsCount: (currentUser.followingsCount || 0) + 1 },
      });

      await userToFollow.updateOne({
        $push: { followers: userId },
        $set: { followersCount: (currentUser.followingsCount || 0) + 1 },
      });

      res.status(200).json({
        success: true,
        message: `You are now following ${userToFollow.username}`,
      });
    } else {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "You already follow this user",
        },
      });
    }
  }),
);

//unfollow a user
router.put(
  "/:id/unfollow",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.sub;
    if (req.params.id === userId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "You can't unfollow yourself",
        },
      });
    }

    const currentUser = await User.findById(userId);
    const userToUnfollow = await User.findById(req.params.id);

    if (!currentUser || !userToUnfollow) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    if (currentUser.followings.includes(req.params.id)) {
      await currentUser.updateOne({
        $pull: { followings: req.params.id },
        $set: { followingsCount: (currentUser.followingsCount || 0) - 1 },
      });

      await userToUnfollow.updateOne({
        $pull: { followers: userId },
        $set: { followersCount: (userToUnfollow.followersCount || 0) - 1 },
      });

      res.status(200).json({
        success: true,
        message: `You unfollowed ${userToUnfollow.username}`,
      });
    } else {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "You don't follow this user" },
      });
    }
  }),
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
  }),
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
  }),
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
  }),
);

router.post(
  "/update-images",
  auth,
  uploadProfile.single("file"),
  uploadToCloudinary,
  asyncHandler(async (req, res) => {
    try {
      const field = req.query.field;
      console.log("Updating field:", field);
      console.log("USER ID:", req.user.id || req.user.sub);
      console.log("Updating field:", req.cloudinaryUrl);
      const allowedFields = ["profilePicture", "coverPicture"];
      if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Invalid field specified" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { [field]: req.cloudinaryUrl } },
        { new: true },
      ).select("-password");

      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "DB Update failed" });
    }
  }),
);

module.exports = router;
