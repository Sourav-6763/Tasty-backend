const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../Model/User");
const { successResponse } = require("../Controller/errorSuccessResponse");
const authRouter = express.Router();

authRouter.post("/google", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    });

    const { access_token, id_token } = tokenRes.data;

    // Fetch user info
    const userInfoRes = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );

    const { name, email, picture } = userInfoRes.data;

    // Check or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, picture });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return successResponse(res, {
      statusCode: 201,
      payload: {
        token,
        user,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Google login failed" });
  }
});

module.exports = authRouter;
