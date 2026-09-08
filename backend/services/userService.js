const supabase = require('../config/supabase');
const User = require('../models/User');

class UserService {
  /**
   * Get user profile by ID
   */
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return new User({
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role || 'member',
      createdAt: data.created_at
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return new User({
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at
    });
  }
}

module.exports = new UserService();
