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

router.get('/debug-fetch', async (req, res) => {
  try {
    const r = await fetch('https://tdnkoixpqmmakliiqfqe.supabase.co/auth/v1/health');
    const text = await r.text();
    res.json({ ok: true, status: r.status, body: text });
  } catch (err) {
    res.json({ ok: false, error: err.message, cause: err.cause ? { message: err.cause.message, code: err.cause.code } : null });
  }
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/habits', habitsRoutes);

// User and Analytics endpoints
router.get('/users/profile', authMiddleware, getProfile);
router.put('/users/profile', authMiddleware, updateProfile);
router.get('/analytics/summary', authMiddleware, getAnalyticsSummary);

module.exports = router;