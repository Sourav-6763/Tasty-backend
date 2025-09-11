const { default: mongoose } = require("mongoose");
const uploadFile = require("../helper/cloudinaryConfig");
const RECIPE = require("../Model/UploadRecipe");
const User = require("../Model/User");
const { errorResponse, successResponse } = require("./errorSuccessResponse");

const UserUploadRecipe = async (req, res, next) => {
  const {
    title,
    description,
    time,
    serving,
    cost,
    steps,
    ingredients,
    userId,
  } = req.body;

  if (
    !title ||
    !description ||
    !time ||
    !serving ||
    !cost ||
    !steps ||
    !ingredients ||
    !userId
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All fields are required",
    });
  }
  try {
    // ✅ Validate image
    if (!req.files || !req.files.photo) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Please select an image",
      });
    }

    // ✅ Upload image to Cloudinary
    const file = req.files.photo;
    const result = await uploadFile(file);

    // ✅ Parse step and ingredients if they're sent as JSON strings
    const parsedSteps = typeof steps === "string" ? JSON.parse(steps) : steps;
    const parsedIngredients =
      typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

    // ✅ Save recipe
    const newRecipe = new RECIPE({
      title,
      description,
      time,
      serving,
      cost,
      imageUrl: result.secure_url,
      steps: parsedSteps,
      ingredients: parsedIngredients,
      user: userId,
    });

    await newRecipe.save();
    const newdata = await User.findByIdAndUpdate(userId, {
      $push: { recipe: newRecipe._id },
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Recipe uploaded successfully",
      payload: newRecipe,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

const ViewUploadRecipe = async (req, res, next) => {
  const { userId } = req.body;

  try {
    // Validate input
    if (!userId) {
      return errorResponse(res, {
        statusCode: 400,
        message: "User ID is required",
      });
    }

    // Fetch user and populate their recipes (ensure 'recipe' is the correct field in the User model)
    const response = await User.findById(userId).populate("recipe");

    // If user not found
    if (!response) {
      return errorResponse(res, {
        statusCode: 404,
        message: "User not found",
      });
    }

    // Successful response
    return successResponse(res, {
      statusCode: 200,
      payload: response,
    });
  } catch (error) {
    next(error);
  }
};

const commentRecipe = async (req, res, next) => {
  const { recipeId } = req.params;
  const { userId, newComment } = req.body;
  // console.log(userId);
  if (!userId) {
    return errorResponse(res, {
      statusCode: 300,
      message: "please  login to comment",
    });
  }

  try {
    const recipe = await RECIPE.findById(recipeId);
    // console.log(recipe);
    recipe.comment.push({
      user: userId,
      text: newComment,
      createdAt: new Date(),
    });
    await recipe.save();

    return successResponse(res, {
      statusCode: 200,
      message: "success",
      payload: {},
    });
  } catch (error) {
    next(error);
  }
};

const getcommentUserRecipe = async (req, res, next) => {
  const { recipeId } = req.params;
  try {
    const updatedRecipe = await RECIPE.findById(recipeId)
      .populate("user", "name email picture") // populate recipe creator
      .populate("comment.user", "name email picture"); // populate each comment’s user

    return successResponse(res, {
      statusCode: 200,
      message: "success",
      payload: { recipe: updatedRecipe },
    });
  } catch (error) {
    next(error);
  }
};
const getcommentOfLikeUserRecipe = async (req, res, next) => {
  const { recipeId } = req.params;
  const { CommentId, UserId } = req.body;

  try {
    const recipe = await RECIPE.findById(recipeId);
    if (!recipe) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Recipe not found",
      });
    }

    const comment = recipe.comment.id(CommentId);
    if (!comment) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Comment not found",
      });
    }

    if (!UserId) {
      return errorResponse(res, { statusCode: 400, message: "Missing UserId" });
    }

    if (comment.Likes.includes(UserId)) {
      comment.Likes.pull(UserId);
      await recipe.save(); // 👈 ensure DB update
      return successResponse(res, {
        statusCode: 200,
        message: "Like removed successfully",
        payload: comment.Likes.length,
      });
    }

    comment.Likes.push(UserId);
    await recipe.save(); // 👈 DB update
    return successResponse(res, {
      statusCode: 200,
      message: "Like added successfully",
      payload: comment.Likes.length,
    });
  } catch (error) {
    return errorResponse(res, { statusCode: 500, message: error.message });
  }
};


module.exports = {
  UserUploadRecipe,
  ViewUploadRecipe,
  commentRecipe,
  getcommentUserRecipe,
  getcommentOfLikeUserRecipe,
};
