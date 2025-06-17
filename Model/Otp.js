const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: { type: String },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 20 * 1000, // 10 seconds from creation time
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a TTL index on the expiresAt field
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
