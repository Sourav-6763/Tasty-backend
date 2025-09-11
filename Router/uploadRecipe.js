const express = require("express");
const { UserUploadRecipe, ViewUploadRecipe, commentRecipe, getcommentUserRecipe, getcommentOfLikeUserRecipe } = require("../Controller/userUploadRecipe");
const { likeRecipe } = require("../Controller/recipe");
const uploadRecipeRouter = express.Router();


uploadRecipeRouter.post("/Recipe", UserUploadRecipe);
uploadRecipeRouter.post("/ViewRecipe", ViewUploadRecipe);
uploadRecipeRouter.post("/like/:recipeId",likeRecipe);
uploadRecipeRouter.post("/comment/:recipeId",commentRecipe);
uploadRecipeRouter.post("/comment/useruploadRecipe/:recipeId",getcommentUserRecipe);
uploadRecipeRouter.post("/comment/useruploadRecipe/like/:recipeId",getcommentOfLikeUserRecipe);
module.exports = uploadRecipeRouter;
