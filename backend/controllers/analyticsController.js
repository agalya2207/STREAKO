const supabase = require('../config/supabase');

const getAnalyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch habits
    const { data: habits, error: habitsErr } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (habitsErr) throw habitsErr;

    const totalHabits = habits ? habits.length : 0;
    const activeStreaks = (habits || []).filter(h => (h.streak || 0) > 0).length;
    const longestStreak = Math.max(0, ...(habits || []).map(h => h.best_streak || h.streak || 0));
    const avgComebackRate = totalHabits > 0
      ? Math.round((habits || []).reduce((acc, h) => acc + (h.comeback_rate || 100), 0) / totalHabits)
      : 100;

    res.status(200).json({
      success: true,
      analytics: {
        totalHabits,
        activeStreaks,
        longestStreak,
        avgComebackRate,
        completionRate: 85
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalyticsSummary
};
