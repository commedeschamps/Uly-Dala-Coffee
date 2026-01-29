const { User } = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new AppError('Email already in use', 400);
    }
  }

  if (username !== undefined) {
    req.user.username = username;
  }
  if (email !== undefined) {
    req.user.email = email.toLowerCase();
  }

  await req.user.save();

  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

module.exports = {
  getProfile,
  updateProfile,
};
