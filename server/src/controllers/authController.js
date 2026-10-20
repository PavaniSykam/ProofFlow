const authService = require('../services/authService');
const config = require('../config/env');

const setAuthCookie = (res, token) => {
  const isProd = config.nodeEnv === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  });
};

const clearAuthCookie = (res) => {
  const isProd = config.nodeEnv === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);
  setAuthCookie(res, token);
  res.json({ user });
};

const logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { user, token } = await authService.changePassword(
    req.user._id,
    currentPassword,
    newPassword
  );
  setAuthCookie(res, token);
  res.json({ user, message: 'Password changed successfully' });
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
};
