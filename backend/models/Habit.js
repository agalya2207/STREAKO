/**
 * Habit Model / Schema Definitions
 */
class Habit {
  constructor({
    id,
    userId,
    title,
    category = 'General',
    streak = 0,
    bestStreak = 0,
    comebackRate = 100,
    status = 'active',
    frequency = 'daily',
    color = '#168CFF',
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.category = category;
    this.streak = streak;
    this.bestStreak = bestStreak;
    this.comebackRate = comebackRate;
    this.status = status;
    this.frequency = frequency;
    this.color = color;
    this.createdAt = createdAt;
  }

  static validate(data) {
    const errors = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Habit title is required.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      category: this.category,
      streak: this.streak,
      bestStreak: this.bestStreak,
      comebackRate: this.comebackRate,
      status: this.status,
      frequency: this.frequency,
      color: this.color,
      createdAt: this.createdAt
    };
  }
}

module.exports = Habit;
