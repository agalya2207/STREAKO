/**
 * Server-side helper utilities
 */
const formatDate = (date = new Date()) => {
  return new Date(date).toISOString().split('T')[0];
};

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

const sendError = (res, error = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message
  });
};

module.exports = {
  formatDate,
  sendSuccess,
  sendError
};
