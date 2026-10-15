const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleAuthUrl,
  googleSignIn
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signup);
router.post('/register', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth & Sign-In routes
router.get('/google', googleAuth);
router.get('/google/url', googleAuthUrl);
router.post('/google', googleSignIn);
router.post('/google-signin', googleSignIn);

router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/me', authMiddleware, updateProfile);

module.exports = router;

