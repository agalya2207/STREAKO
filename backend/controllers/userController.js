const userService = require('../services/userService');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updatedUser = await userService.updateProfile(userId, req.body);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
