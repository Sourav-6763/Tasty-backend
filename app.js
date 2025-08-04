process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optional: process.exit(1); // Restart app via PM2 or nodemon
});

require("dotenv").config();
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt=require('jsonwebtoken');
const recipeRouter = require('./Router/recipeRoute');
const createError = require("http-errors");
const { errorResponse } = require('./Controller/errorSuccessResponse');
const authRouter = require('./Router/authRoute');
const userRouter = require("./Router/userRoute");
const fileupload =require("express-fileupload");
const uploadRecipeRouter = require("./Router/uploadRecipe");



const app = express(); // Initialize the express app first
app.use(express.json());
app.use(cors({
 origin: '*',
}));


const port = process.env.PORT || 5000;


async function main(options = {}) {
  try {
    await mongoose.connect(process.env.MONGO_URL, options);
    console.log("Connected to DB");
  } catch (err) {
    console.error("Error connecting to DB", err);
  }
}

main();

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use('/api/recipe',recipeRouter);
app.use('/api/auth', authRouter); 
app.use('/api/user', userRouter); 
app.use('/api/user/upload',uploadRecipeRouter); 





// Client error handling
app.use((req, res, next) => {
  const err = createError(404, "Route not found");
  next(err);
});

// Server error handling (generic error handler)
app.use((err, req, res, next) => {
  return errorResponse(res, {
    statusCode: err.status || 500,
    message: err.message || "Internal Server Error",
  });
});
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
