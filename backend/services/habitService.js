const supabase = require('../config/supabase');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

class HabitService {
  /**
   * Get all habits for a specific user
   */
  async getHabitsByUser(userId) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => new Habit({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      category: item.category,
      streak: item.streak,
      bestStreak: item.best_streak,
      comebackRate: item.comeback_rate,
      status: item.status,
      frequency: item.frequency,
      color: item.color,
      createdAt: item.created_at
    }));
  }

  /**
   * Create a new habit
   */
  async createHabit(userId, habitData) {
    const validation = Habit.validate(habitData);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: userId,
          title: habitData.title,
          category: habitData.category || 'General',
          streak: 0,
          best_streak: 0,
          comeback_rate: 100,
          status: 'active',
          frequency: habitData.frequency || 'daily',
          color: habitData.color || '#168CFF'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return new Habit({
      id: data.id,
      userId: data.user_id,
      title: data.title,
      category: data.category,
      streak: data.streak,
      bestStreak: data.best_streak,
      comebackRate: data.comeback_rate,
      status: data.status,
      frequency: data.frequency,
      color: data.color,
      createdAt: data.created_at
    });
  }

  /**
   * Log habit completion / toggle
   */
  async toggleHabitCompletion(userId, habitId, date = new Date().toISOString().split('T')[0]) {
    // Check if habit belongs to user
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (habitError || !habit) {
      const err = new Error('Habit not found');
      err.statusCode = 404;
      throw err;
    }

    // Check existing log
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .single();

    if (existingLog) {
      // Toggle off
      await supabase.from('habit_logs').delete().eq('id', existingLog.id);
      const newStreak = Math.max(0, (habit.streak || 1) - 1);
      await supabase.from('habits').update({ streak: newStreak }).eq('id', habitId);
      return { completed: false, streak: newStreak };
    } else {
      // Toggle on
      await supabase.from('habit_logs').insert([{ habit_id: habitId, user_id: userId, date, completed: true }]);
      const newStreak = (habit.streak || 0) + 1;
      const bestStreak = Math.max(habit.best_streak || 0, newStreak);
      await supabase.from('habits').update({ streak: newStreak, best_streak: bestStreak }).eq('id', habitId);
      return { completed: true, streak: newStreak, bestStreak };
    }
  }

  /**
   * Delete a habit
   */
  async deleteHabit(userId, habitId) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}

module.exports = new HabitService();
