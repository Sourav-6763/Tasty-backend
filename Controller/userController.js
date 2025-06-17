const emailWithNodeMailer = require("../helper/Nodemailer");
const OTP = require("../Model/Otp");
const bcrypt = require("bcryptjs");
const {
  successResponse,
  errorResponse,
} = require("../Controller/errorSuccessResponse");
const User = require("../Model/User");
const jwt = require("jsonwebtoken");

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
    const userTypeOtp = Number(otp);

    const otpRecord = await OTP.findOne({ email });
    const genarateOtp = Number(otpRecord.otp);

    // Check if OTP record exists
    if (!otpRecord) {
      return successResponse(res, {
        statusCode: 200,
        message: "Provide Otp",
        payload: {},
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return successResponse(res, {
        statusCode: 200,
        message: "OTP is expired",
        payload: {},
      });
    }

    // Check if OTP matches
    if (genarateOtp !== userTypeOtp) {
      return successResponse(res, {
        statusCode: 200,
        message: "OTP not matched",
        payload: {},
      });
    }

    // OTP is valid
    if (genarateOtp === userTypeOtp) {
      return successResponse(res, {
        statusCode: 200,
        message: "OTP verified successfully",
        payload: {},
      });
    }
  } catch (error) {
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

module.exports = {
  sentOTP,
  verifyOTP,
  signup,
  login,
};
