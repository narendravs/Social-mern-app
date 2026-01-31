const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { authLimiter } = require("../middlewares/rateLimiter");
const asyncHandler = require("../middlewares/asyncHandler");
const User = require("../models/user");

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  city: z.string().optional(),
  from: z.string().optional(),
  relationship: z.enum(["Single", "Married", "Other"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      $or: [
        { email: body.email.toLowerCase() },
        { username: body.username.toLowerCase() },
      ],
    });
    if (existingUser) {
      return res.status(400).json({
        error: {
          code: "DUPLICATE",
          message: "Username or Email already exists",
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(body.password, salt);

    const newUser = new User({
      username: body.username,
      email: body.email,
      password: hashPassword,
      city: body.city,
      from: body.from,
      relationship: body.relationship,
    });

    const user = await newUser.save();

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      roles: user.isAdmin ? ["admin"] : ["user"],
    });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          isAdmin: user.isAdmin,
          followersCount: user.followersCount,
          followingsCount: user.followingsCount,
        },
        accessToken,
      });
  }),
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "User not found" } });

    if (!user.password) {
      return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "User data corrupted" },
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Wrong password" },
      });

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      username: user.username,
      roles: user.isAdmin ? ["admin"] : ["user"],
    });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });
    const { password: userPassword, ...otherDetails } = user._doc;
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        user: otherDetails,
        accessToken,
      });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing refresh token" },
      });
    try {
      const decoded = verifyRefreshToken(token);
      // Token rotation (simple): issue new
      const accessToken = signAccessToken({ sub: decoded.sub });
      const refreshToken = signRefreshToken({ sub: decoded.sub });
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({ accessToken });
    } catch (err) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
        },
      });
    }
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ success: true });
  }),
);

module.exports = router;
