const purchaseService = require('../services/purchaseService');

const getItems = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const items = await purchaseService.getItems(userId);
    res.status(200).json({ success: true, items });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const item = await purchaseService.createItem(userId, req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const { id } = req.params;
    const item = await purchaseService.updateItem(userId, id, req.body);
    res.status(200).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const { id } = req.params;
    const { status } = req.body;
    const result = await purchaseService.updateStatus(userId, id, status);
    res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

const recordReminder = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const { id } = req.params;
    const result = await purchaseService.recordReminder(userId, id);
    res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.headers['x-user-id'] || null;
    const { id } = req.params;
    await purchaseService.deleteItem(userId, id);
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  createItem,
  updateItem,
  updateStatus,
  recordReminder,
  deleteItem
};
