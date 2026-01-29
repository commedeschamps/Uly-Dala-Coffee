const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createToken = (userId) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;
  const safeRole = ['user', 'premium'].includes(role) ? role : 'user';

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const user = await User.create({
    username,
    email,
    password,
    role: safeRole,
  });

  const token = createToken(user.id);

  res.status(201).json({
    status: 'success',
    token,
    user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = createToken(user.id);

  res.status(200).json({
    status: 'success',
    token,
    user: user.toJSON(),
  });
});

module.exports = {
  register,
  login,
};
