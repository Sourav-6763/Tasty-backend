const emailWithNodeMailer = require("../helper/nodemailer");
const OTP = require("../Model/Otp");
const bcrypt = require("bcryptjs");
const {
  successResponse,
  errorResponse,
} = require("../Controller/errorSuccessResponse");
const User = require("../Model/User");
const jwt = require("jsonwebtoken");
const uploadFile = require("../helper/cloudinaryConfig");
const cloudinary = require("cloudinary").v2;

const sentOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Validate email input
    if (!email) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email is required",
      });
    }

    // Generate 4-digit OTP
    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    // Prepare email content
    const emailData = {
      email,
      subject: "Account Activation Email",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${randomNumber}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
`,
    };
    // Send email
    try {
      await emailWithNodeMailer(emailData);
    } catch (err) {
      return errorResponse(res, {
        statusCode: 500,
        message: "Failed to send email",
      });
    }
    const prevOtpRecord = await OTP.findOne({ email });
    if (prevOtpRecord) {
      await OTP.deleteOne({ _id: prevOtpRecord._id });
    }
    // Save OTP to DB
    const otpRecord = new OTP({
      email,
      otp: randomNumber,
      createdAt: new Date(),
    });
    await otpRecord.save();

    return successResponse(res, {
      statusCode: 200,
      message: "OTP sent successfully",
      payload: {},
    });
  } catch (err) {
    next(err);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { otp, email } = req.body;

    const newotp = otp.join("");
    const otpRecord = await OTP.findOne({ email });

    // Check existence
    if (!otpRecord) {
      return errorResponse(res, {
        statusCode: 404,
        message: "OTP not found or already verified.",
      });
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ email }); // Optional cleanup
      return errorResponse(res, {
        statusCode: 410, // Gone
        message: "OTP has expired.",
      });
    }

    // Check match
    const userTypedOtp = Number(newotp);
    const storedOtp = Number(otpRecord.otp);

    if (storedOtp !== userTypedOtp) {
      return errorResponse(res, {
        statusCode: 400,
        message: "OTP is incorrect.",
      });
    }

    // OTP is correct — delete from DB and return success
    await OTP.deleteOne({ email });

    return successResponse(res, {
      statusCode: 200,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    next(error);
  }
};

const signup = async (req, res, next) => {
  const { password, email, name } = req.body;
  try {
    if (!password || !email || !name) {
      return successResponse(res, {
        statusCode: 400,
        message: "Email and password and UserName are required.",
        payload: {},
      });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return successResponse(res, {
        statusCode: 409,
        message: "User already exists.",
        payload: {},
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newuser = new User({
      name,
      email,
      password: hashPassword,
    });
    await newuser.save();

    return successResponse(res, {
      statusCode: 201,
      message: "User Register Successfully",
      payload: {},
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return errorResponse(res, {
      statusCode: 400, // Bad request
      message: "Email and password are required.",
      payload: {},
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return errorResponse(res, {
      statusCode: 404, // Not found
      message: "User not found. Please register.",
      payload: {},
    });
  }

  if (!user.password) {
    return errorResponse(res, {
      statusCode: 401, // Unauthorized
      message:
        "This account was registered via Google. Please login with Google.",
      payload: {},
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return errorResponse(res, {
      statusCode: 401, // Unauthorized
      message: "Incorrect password.",
      payload: {},
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return successResponse(res, {
    statusCode: 200,
    message: "Login Successfully",
    payload: {
      token,
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
      },
    },
  });
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, FavoriteFood } = req.body;
    const updateFields = {
      name,
      email,
      FavoriteFood,
    };
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Check for uploaded file (cover photo)
    if (req.files && req.files.coverPhoto) {
      if (user.coverPhoto?.public_id) {
        await cloudinary.uploader.destroy(user.coverPhoto.public_id);
      }
      const uploaded = await uploadFile(req.files.coverPhoto); // ⬅️ Cloudinary upload
      updateFields.coverPhoto = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    if (req.files && req.files.avtarPhoto) {
      if (user.picture?.public_id) {
        await cloudinary.uploader.destroy(user.picture.public_id);
      }
      const uploaded = await uploadFile(req.files.avtarPhoto); // ⬅️ Cloudinary upload
      updateFields.picture = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    return res.json({ success: true, payload: { updatedUser } });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  sentOTP,
  verifyOTP,
  signup,
  login,
  updateProfile,
};
