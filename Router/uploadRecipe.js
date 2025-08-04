const express = require("express");
const { UserUploadRecipe, ViewUploadRecipe } = require("../Controller/userUploadRecipe");
const uploadRecipeRouter = express.Router();


uploadRecipeRouter.post("/Recipe", UserUploadRecipe);
uploadRecipeRouter.post("/ViewRecipe", ViewUploadRecipe);
module.exports = uploadRecipeRouter;
