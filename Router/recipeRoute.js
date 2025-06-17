const express = require("express");
const { searchRecipe, searchRecipeById, quickAns } = require("../Controller/recipe");
const recipeRouter = express.Router();


recipeRouter.get("/search/:query", searchRecipe);
recipeRouter.get("/recipeDetails/:id", searchRecipeById);
recipeRouter.get("/quickAns/:q", quickAns); 
module.exports = recipeRouter;