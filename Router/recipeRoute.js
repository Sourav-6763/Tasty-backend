const express = require("express");
const { searchRecipe, searchRecipeById, quickAns, commentSection, getRecipeComment, randomRecipes, getuserUploadRecipe, likeRecipe } = require("../Controller/recipe");
const recipeRouter = express.Router();


recipeRouter.get("/search/:query", searchRecipe);
recipeRouter.get("/recipeDetails/:id", searchRecipeById);
recipeRouter.get("/quickAns", quickAns);
recipeRouter.post("/userComment", commentSection);
recipeRouter.post("/ViewuserComment", getRecipeComment);
recipeRouter.get("/getRandomRecipe",randomRecipes);
recipeRouter.get("/getUserRecipe",getuserUploadRecipe);
recipeRouter.post("/like/:recipeId",likeRecipe);
module.exports = recipeRouter;
