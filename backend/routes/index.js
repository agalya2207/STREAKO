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
  const results = {};
  try {
    const r = await fetch('https://tdnkoixpqmmakliiqfqe.supabase.co/auth/v1/health');
    results.health = { status: r.status };
  } catch (e) {
    results.health = { error: e.message, cause: e.cause ? { message: e.cause.message, code: e.cause.code } : null };
  }

  try {
    const supabase = require('../config/supabase');
    const dbTest = await supabase.from('profiles').select('id').limit(1);
    results.db = dbTest;
  } catch (e) {
    results.db = { error: e.message, cause: e.cause ? { message: e.cause.message, code: e.cause.code } : null };
  }

  try {
    const supabaseAuthClient = require('../config/supabaseAuthClient');
    const authTest = await supabaseAuthClient.auth.signUp({
      email: 'test_probe_' + Date.now() + '@probe.com',
      password: 'ProbePassword123!'
    });
    results.auth = authTest;
  } catch (e) {
    results.auth = { error: e.message, cause: e.cause ? { message: e.cause.message, code: e.cause.code } : null };
  }

  res.json(results);
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/habits', habitsRoutes);

// User and Analytics endpoints
router.get('/users/profile', authMiddleware, getProfile);
router.put('/users/profile', authMiddleware, updateProfile);
router.get('/analytics/summary', authMiddleware, getAnalyticsSummary);

module.exports = router;