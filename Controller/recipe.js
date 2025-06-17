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
const { successResponse } = require("./errorSuccessResponse");
const axios = require("axios");

const searchRecipe = async (req, res, next) => {
  const query = req.params.query || "";
  const page = req.query.page || 1; // Page number from query params (default to 1)
  const offset = (page - 1) * 10; // Assuming 20 results per page
  try {
    const response = await axios.get(
      "https://api.spoonacular.com/recipes/complexSearch",
      {
        params: {
          query,
          apiKey: process.env.SPOONACULAR_API_KEY,
          number: 10,
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
    // const nutritionWidget = await axios.get(`https://api.spoonacular.com/food/products/${id}/nutritionWidget`, {
    //   params: {
    //     apiKey: process.env.SPOONACULAR_API_KEY,  // The API key for authorization
    //     defaultCss:true
    //   },
    // });
    // Respond with the API response data
    return successResponse(res, {
      statusCode: 200,
      message: "Successful",
      payload: {
        information: infoResponse.data,
        nutrition: nutritionResponse.data,
        similarRecipe: similarRecipeResponse.data,
        // nutritionWidget:nutritionWidget.data
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

const quickAns = async (req, res, next) => {
  const question = req.params.q;
  let result = question.splite(" ").join("+");
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/quickAnswer`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          q: result,
        },
      }
    );
    res.json(response.data);
    console.log(response.data);
  } catch (error) {
    next(error);
  }
};



module.exports = {
  searchRecipe,
  searchRecipeById,
  quickAns,
};
