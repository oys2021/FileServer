const mongoose = require('mongoose');

// Define User schema
// Define User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

// Define VerificationToken schema
const verificationTokenSchema = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // Token will expire after 24 hours
  },
});

const User = mongoose.model('User', userSchema);

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);

module.exports = { User, VerificationToken };
