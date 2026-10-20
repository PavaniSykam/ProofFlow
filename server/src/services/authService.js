const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const BCRYPT_COST = 12;

class AuthService {
  /**
   * Authenticate user by email and password.
   * Returns the user document and a signed JWT.
   * Generic error message prevents user enumeration.
   */
  async login(email, password) {
    // Load user with passwordHash explicitly selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }
    if (!user.isActive) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Generate a JWT for the user.
   * Payload contains only user id and tokenVersion.
   */
  generateToken(user) {
    return jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  /**
   * Hash a plaintext password.
   */
  async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  /**
   * Change password for authenticated user.
   * Increments tokenVersion to invalidate existing tokens.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('INVALID_PASSWORD', 400, 'Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new AppError('WEAK_PASSWORD', 400, 'Password must be at least 8 characters');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    user.mustChangePassword = false;
    user.tokenVersion += 1;
    await user.save();

    await user.populate('departmentId');

    const token = this.generateToken(user);
    return { user, token };
  }
}

module.exports = new AuthService();
