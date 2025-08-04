const uploadFile = require("../helper/cloudinaryConfig");
const RECIPE = require("../Model/UploadRecipe");
const User = require("../Model/User");
const { errorResponse, successResponse } = require("./errorSuccessResponse");

const UserUploadRecipe = async (req, res,next) => {
  const { title, description, time, serving, cost, step, ingredients, userId } =
    req.body;
  if (
    !title ||
    !description ||
    !time ||
    !serving ||
    !cost ||
    !step ||
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
    const parsedSteps = typeof step === "string" ? JSON.parse(step) : step;
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
    const newdata=await User.findByIdAndUpdate(userId,{$push:{recipe:newRecipe._id}});
    await newdata.save();

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



module.exports = {
  UserUploadRecipe,ViewUploadRecipe
};
