const express = require('express');
const router = express.Router();
const { signup, login, logout, getCurrentUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signup);
router.post('/register', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;