/**
 * User Model / Schema Definitions
 */
class User {
  constructor({ id, email, fullName, role = 'member', createdAt = new Date().toISOString() }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.createdAt = createdAt;
  }

  static validate(data) {
    const errors = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('A valid email address is required.');
    }
    if (data.password && data.password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
