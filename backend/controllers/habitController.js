const habitService = require('../services/habitService');

const getHabits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habits = await habitService.getHabitsByUser(userId);
    res.status(200).json({ success: true, habits });
  } catch (err) {
    next(err);
  }
};

const createHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const newHabit = await habitService.createHabit(userId, req.body);
    res.status(201).json({ success: true, habit: newHabit });
  } catch (err) {
    next(err);
  }
};

const toggleHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date } = req.body;
    const result = await habitService.toggleHabitCompletion(userId, id, date);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const deleteHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await habitService.deleteHabit(userId, id);
    res.status(200).json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHabits,
  createHabit,
  toggleHabit,
  deleteHabit
};
