import api from './api.js';

export class HabitService {
    static async getHabits() {
        return api.get('/habits');
    }

    static async createHabit(habitData) {
        return api.post('/habits', habitData);
    }

    static async toggleHabit(habitId, date) {
        return api.post(`/habits/${habitId}/toggle`, { date });
    }

    static async deleteHabit(habitId) {
        return api.delete(`/habits/${habitId}`);
    }
}

export default HabitService;
