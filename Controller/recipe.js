// const { successResponse } = require("./errorSuccessResponse");
// const axios = require('axios');

// const searchRecipe = async (req, res, next) => {
//   const query = req.params.query || '';  // Get the search term from route params (not query params)
//   try {
//     // Use the correct query parameter 'i' for ingredient filtering

//     const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?', {
//       params: {
//         s: query,  // The API expects 'i' for ingredients
//       },
//     });
//     // Respond with the API response data
//     return successResponse(res, {
//       statusCode: 200,
//       message: "Successful",
//       payload: response.data,  // Use response.data to get the actual data
//     });

//   } catch (error) {
//     console.error("Error from API:", error.response ? error.response.data : error.message);
//     next(error);  // Pass the error to the error handler
//   }
// };

// const searchRecipeById = async (req, res, next) => {
//   const id = req.params.id || '';  // Get the search term from route params (not query params)
//   try {
//     // Use the correct query parameter 'i' for ingredient filtering

//     const response = await axios.get('www.themealdb.com/api/json/v1/1/lookup.php?', {
//       params: {
//         i: id,  // The API expects 'i' for ingredients
//       },
//     });
//     // Respond with the API response data
//     return successResponse(res, {
//       statusCode: 200,
//       message: "Successful",
//       payload: response.data,  // Use response.data to get the actual data
//     });

//   } catch (error) {
//     console.error("Error from API:", error.response ? error.response.data : error.message);
//     next(error);  // Pass the error to the error handler
//   }
// };

// module.exports = {
//   searchRecipe,
//   searchRecipeById
// };

const { response } = require("express");
const { successResponse, errorResponse } = require("./errorSuccessResponse");
const axios = require("axios");
const Comment = require("../Model/Comment");

const { GoogleGenAI } = require("@google/genai");
const RECIPE = require("../Model/UploadRecipe");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// routes/recipe.js

const likeRecipe = async (req, res, next) => {
  const { recipeId } = req.params;
  const { userId } = req.body;

  try {
    const recipe = await RECIPE.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    // console.log(recipe);
    // Prevent duplicate likes
    if (recipe.likes.includes(userId)) {
      const data = await RECIPE.findByIdAndUpdate(recipeId, {
        $pull: { likes: userId },
      });
      const updated = await RECIPE.findById(recipeId); // get updated count

      return successResponse(res, {
        statusCode: 200,
        message: "Unliked successfully",
        payload: { likecount: updated.likes.length },
      });
    }

    // Push userId to likes array

    recipe.likes.push(userId);
    await recipe.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Successful",
      payload: { likecount: recipe.likes.length },
    });
  } catch (error) {
    console.error("likeRecipe error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getuserUploadRecipe = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  try {
    const results = await RECIPE.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("user"); // Optional: latest first

    const totalResults = await RECIPE.countDocuments({});

    res.status(200).json({
      success: true,
      payload: {
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
};

const searchRecipe = async (req, res, next) => {
  const query = req.params.query || "";
  const page = req.query.page || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  try {
    const response = await axios.get(
      "https://api.spoonacular.com/recipes/complexSearch",
      {
        params: {
          query,
          apiKey: process.env.SPOONACULAR_API_KEY,
          number: 12,
          offset: offset,
        },
      }
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Successful",
      payload: response.data,
    });
  } catch (error) {
    console.error(
      "Error from API:",
      error.response ? error.response.data : error.message
    );
    next(error);
  }
};

const searchRecipeById = async (req, res, next) => {
  const id = req.params.id || ""; // Get the recipe ID from route params
  try {
    // Use the Spoonacular API's recipe information endpoint to fetch by ID
    const infoResponse = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY, // The API key for authorization
        },
      }
    );
    const nutritionResponse = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/nutritionWidget.json`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY, // The API key for authorization
        },
      }
    );
    const similarRecipeResponse = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/similar`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY, // The API key for authorization
        },
      }
    );

    // Respond with the API response data
    return successResponse(res, {
      statusCode: 200,
      message: "Successful",
      payload: {
        information: infoResponse.data,
        nutrition: nutritionResponse.data,
        similarRecipe: similarRecipeResponse.data,
      },
    });
  } catch (error) {
    console.error(
      "Error from API:",
      error.response ? error.response.data : error.message
    );
    next(error); // Pass the error to the error handler
  }
};

// const quickAns = async (req, res, next) => {
//   const text = req.query.q;
//   try {
//     const response = await axios.get("https://api.spoonacular.com/food/converse", {
//       params: {
//         text: text,
//         apiKey: process.env.SPOONACULAR_API_KEY,
//       },
//     });
//     return successResponse(res, {
//       statusCode: 200,
//       message: "Successful",
//       payload: response.data,
//     });

//   } catch (error) {
//     console.error("Spoonacular API Error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to fetch data" });
//   }
// };

const quickAns = async (req, res, next) => {
  const text = req.query.q;

  try {
    if (!text) {
      return res.status(400).json({ error: "Missing query parameter: q" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: text,
    });

    const output = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!output) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Successful",
      payload: output,
    });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to fetch response from Gemini" });
  }
};

const commentSection = async (req, res, next) => {
  const { userId, RecipeId, comment } = req.body;
  if (!userId) {
    return errorResponse(res, {
      statusCode: 200,
      message: "User not Logged in ",
      payload: {},
    });
  }
  const record = new Comment({
    user: userId,
    recipeId: RecipeId,
    content: comment,
  });
  await record.save();
  //  user.comment.push(record._id);
  // await user.save()
  return successResponse(res, {
    statusCode: 200,
    message: "comment successfull ",
    payload: {},
  });
};

const getRecipeComment = async (req, res, next) => {
  try {
    const { userId, RecipeId } = req.body;

    const record = await Comment.find({ recipeId: RecipeId })
      .populate("user")
      .sort({ createdAt: -1 });
    return successResponse(res, {
      statusCode: 200,
      message: "Comment fetch successful",
      payload: { record },
    });
  } catch (error) {
    console.error("Error in getRecipeComment:", error.message);
    return errorResponse(res, {
      statusCode: 500,
      message: "Error fetching comments",
    });
  }
};

const randomRecipes = async (req, res, next) => {
  try {
    const response = await axios.get(
      "https://api.spoonacular.com/recipes/random",
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          number: 3,
        },
      }
    );

    const recipes = response.data.recipes;

    return successResponse(res, {
      statusCode: 200,
      message: "Fetch successful",
      payload: { recipes }, // 👈 cleaner response
    });
  } catch (error) {
    console.error("Error fetching random recipes:", error.message);
    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to fetch random recipes",
    });
  }
};

module.exports = {
  searchRecipe,
  searchRecipeById,
  quickAns,
  commentSection,
  getRecipeComment,
  randomRecipes,
  getuserUploadRecipe,
  likeRecipe,
};
