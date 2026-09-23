const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const habitsRoutes = require('./habits.routes');
const { getProfile, updateProfile } = require('../controllers/userController');
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const { checkDatabaseConnection } = require('../config/database');

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();
  res.status(200).json({
    status: 'ok',
    version: '2.0.1',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'degraded',
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/habits', habitsRoutes);

// User and Analytics endpoints
router.get('/users/profile', authMiddleware, getProfile);
router.put('/users/profile', authMiddleware, updateProfile);
router.get('/analytics/summary', authMiddleware, getAnalyticsSummary);

module.exports = router;