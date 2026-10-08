const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const {
  getItems,
  createItem,
  updateItem,
  updateStatus,
  recordReminder,
  deleteItem
} = require('../controllers/purchaseController');

// Soft auth middleware: identifies logged-in Supabase user if token is provided,
// while also supporting guest/offline sessions seamlessly
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.length > 20 && !token.startsWith('mock_')) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Continue even if token is invalid, fallback to guest
  }
  next();
};

router.use(optionalAuth);

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.patch('/:id/status', updateStatus);
router.post('/:id/reminder', recordReminder);
router.delete('/:id', deleteItem);

module.exports = router;
