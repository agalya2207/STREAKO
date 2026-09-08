/**
 * Server-side validation utilities
 */
class Validators {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
  }

  static isStrongPassword(password) {
    if (typeof password !== 'string' || password.length < 6) return false;
    return true;
  }

  static isValidHabitTitle(title) {
    return typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 100;
  }
}

module.exports = Validators;
