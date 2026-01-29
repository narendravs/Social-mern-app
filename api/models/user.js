const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true, // fix: was `require`
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: [String], // keep compatibility with existing code
      default: [],
    },
    friends: [
      {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        profilePicture: { type: String, default: "" },
      },
    ],

    followings: {
      type: [String], // keep compatibility with existing code
      default: [],
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingsCount: {
      type: Number,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      maxlength: 160,
      default: "",
    },
    city: {
      type: String,
      maxlength: 50,
      default: "",
    },
    from: {
      type: String,
      maxlength: 50,
      default: "",
    },
    relationship: {
      type: String,
      enum: ["Single", "Married", "Other"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance and uniqueness
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
