const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const workflowRoutes = require('./workflowRoutes');
const requestRoutes = require('./requestRoutes');
const approvalRoutes = require('./approvalRoutes');
const attachmentRoutes = require('./attachmentRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const delegationRoutes = require('./delegationRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

// Health check endpoint with database connectivity status
router.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'healthy' : 'unhealthy';
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: isDbConnected,
      readyState: mongoose.connection.readyState,
    },
  });
});

// Mounted API routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/workflows', workflowRoutes);
router.use('/requests', requestRoutes);
router.use('/approvals', approvalRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/delegations', delegationRoutes);
router.use('/ai', aiRoutes);

// Additional top-level route aliases matching spec directly
router.get('/users/lookup', (req, res, next) => {
  adminRoutes.handle(req, res, next);
});

module.exports = router;
