const supabase = require('./supabase');

/**
 * Database connection helper and health checker
 */
const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Database health check warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Database connection error:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  checkDatabaseConnection
};
