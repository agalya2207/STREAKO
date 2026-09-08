const express = require('express');
const router = express.Router();
const { getHabits, createHabit, toggleHabit, deleteHabit } = require('../controllers/habitController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getHabits);
router.post('/', createHabit);
router.post('/:id/toggle', toggleHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
