const express = require("express");
const userRouter = express.Router();

const {
  sentOTP,
  verifyOTP,
  signup,
  login,
  updateProfile,
} = require("../Controller/userController"); 

// Route to send OTP
userRouter.post("/sentOTP", sentOTP);

// Route to verify OTP
userRouter.post("/verifyOTP", verifyOTP);

// Route to sign up user
userRouter.post("/signup", signup);

// Route to login user
userRouter.post("/login", login);
userRouter.put("/updateUser",updateProfile);

module.exports = userRouter;
