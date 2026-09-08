/**
 * HabitLog Model for tracking completions and streak history
 */
class HabitLog {
  constructor({ id, habitId, userId, date, completed = true, notes = '', createdAt = new Date().toISOString() }) {
    this.id = id;
    this.habitId = habitId;
    this.userId = userId;
    this.date = date;
    this.completed = completed;
    this.notes = notes;
    this.createdAt = createdAt;
  }

  static validate(data) {
    const errors = [];
    if (!data.habitId) errors.push('habitId is required.');
    if (!data.date) errors.push('date is required.');
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      habitId: this.habitId,
      userId: this.userId,
      date: this.date,
      completed: this.completed,
      notes: this.notes,
      createdAt: this.createdAt
    };
  }
}

module.exports = HabitLog;
