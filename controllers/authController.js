const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const createToken = (userId) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

const normalizeAppUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

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

  await sendWelcomeEmail({ to: user.email, name: user.username });

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

const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const genericMessage =
    'If an account with that email exists, a password reset link has been sent.';
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: genericMessage,
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const appUrl =
    normalizeAppUrl(process.env.APP_URL) || normalizeAppUrl(`${req.protocol}://${req.get('host')}`);
  const resetUrl = `${appUrl}/auth.html?mode=reset&token=${resetToken}`;
  const expiresMinutes = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15);

  await sendPasswordResetEmail({
    to: user.email,
    name: user.username,
    resetUrl,
    expiresMinutes,
  });

  res.status(200).json({
    status: 'success',
    message: genericMessage,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const rawToken = req.params.token;
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Reset token is invalid or has expired', 400);
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

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
  forgotPassword,
  resetPassword,
};
