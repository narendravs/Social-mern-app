const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
    });
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const password = req.body.password;
    const user = await User.findOne({ email: req.body.email });
    if (!user) res.status(404).json("user not found");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(404).json("wrong password");

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;
