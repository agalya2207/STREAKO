/**
 * UNIFIED STORAGE & DATA LAYER FOR STREAKO (HABIT-BAY / DAILYOS COMPATIBLE)
 */

export class Storage {
    static PREFIX = 'dailyos_';

    static set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('[Storage Error] Failed to set:', key, e);
            return false;
        }
    }

    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data !== null ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('[Storage Error] Failed to get:', key, e);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            console.error('[Storage Error] Failed to remove:', key, e);
            return false;
        }
    }

    static exists(key) {
        return localStorage.getItem(this.PREFIX + key) !== null;
    }

    // ==========================================
    // USER PROFILE & PREFERENCES
    // ==========================================
    static getUser() {
        return this.get('user', {
            id: 'local-user',
            name: 'Alex Vance',
            email: 'alex.vance@dailyos.app',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            role: 'Product Designer',
            timezone: 'UTC+05:30 (IST)',
            appearance: 'obsidian',
            accentColor: 'lime',
            weekStart: 'Monday',
            timeFormat: '12h',
            notifications: {
                morning: true,
                morningTime: '07:30',
                evening: true,
                eveningTime: '21:30',
                habit: true,
                sounds: true,
                streakProtection: true
            }
        });
    }

    static setUser(user) {
        return this.set('user', user);
    }

    static updateProfile(updates) {
        const current = this.getUser();
        const merged = { ...current, ...updates };
        this.setUser(merged);
        return merged;
    }

    // ==========================================
    // HABITS & COMPLETIONS
    // ==========================================
    static getHabits() {
        const habits = this.get('habits', null);
        if (!habits || habits.length === 0) {
            return this.seedDefaultHabits();
        }
        return habits;
    }

    static setHabits(habits) {
        return this.set('habits', habits);
    }

    static getHabit(id) {
        const habits = this.getHabits();
        return habits.find(h => h.id === id) || null;
    }

    static addHabit(habit) {
        const habits = this.getHabits();
        const newHabit = {
            id: 'h-' + Date.now(),
            name: habit.name || 'New Routine',
            description: habit.description || '',
            category: habit.category || 'Productivity',
            icon: habit.icon || '⚡',
            accentColor: habit.accentColor || habit.color || '#84cc16',
            color: habit.accentColor || habit.color || '#84cc16',
            frequency: habit.frequency || 'Daily',
            frequencyLabel: habit.frequencyLabel || 'Daily',
            dailyTarget: parseInt(habit.dailyTarget || habit.target || 1, 10),
            target: parseInt(habit.dailyTarget || habit.target || 1, 10),
            streak: 0,
            bestStreak: 0,
            current_streak: 0,
            best_streak: 0,
            active: habit.paused !== true,
            paused: habit.paused === true,
            sessions: habit.sessions || [],
            startTime: habit.startTime || '08:00',
            endTime: habit.endTime || '08:30',
            weekdays: habit.weekdays || [],
            createdAt: new Date().toISOString()
        };
        habits.push(newHabit);
        this.setHabits(habits);
        return newHabit;
    }

    static updateHabit(id, updates) {
        const habits = this.getHabits();
        const idx = habits.findIndex(h => h.id === id);
        if (idx !== -1) {
            habits[idx] = { ...habits[idx], ...updates };
            if (updates.accentColor && !updates.color) habits[idx].color = updates.accentColor;
            if (updates.color && !updates.accentColor) habits[idx].accentColor = updates.color;
            if (updates.paused !== undefined) habits[idx].active = !updates.paused;
            this.setHabits(habits);
            return habits[idx];
        }
        return null;
    }

    static deleteHabit(id) {
        const habits = this.getHabits().filter(h => h.id !== id);
        this.setHabits(habits);
        // Also remove logs
        const logs = this.getHabitLogs().filter(l => l.habit_id !== id && l.habitId !== id);
        this.setHabitLogs(logs);
        return true;
    }

    // ==========================================
    // HABIT LOGS (HISTORY & HEATMAPS)
    // ==========================================
    static getHabitLogs() {
        return this.get('habit_logs', []);
    }

    static setHabitLogs(logs) {
        return this.set('habit_logs', logs);
    }

    static isCompleted(habitId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const logs = this.getHabitLogs();
        return logs.some(l => (l.habit_id === habitId || l.habitId === habitId) && l.date === targetDate && l.completed);
    }

    static markCompleted(habitId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const logs = this.getHabitLogs();
        const existing = logs.find(l => (l.habit_id === habitId || l.habitId === habitId) && l.date === targetDate);
        if (existing) {
            existing.completed = true;
        } else {
            logs.push({
                id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                habit_id: habitId,
                habitId: habitId,
                date: targetDate,
                completed: true,
                created_at: new Date().toISOString()
            });
        }
        this.setHabitLogs(logs);

        // Recalculate streak
        const habit = this.getHabit(habitId);
        if (habit) {
            const streak = this.calculateHabitStreak(habitId);
            const best = Math.max(habit.bestStreak || 0, streak);
            this.updateHabit(habitId, { streak, current_streak: streak, bestStreak: best, best_streak: best });
        }
        return true;
    }

    static unmarkCompleted(habitId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        let logs = this.getHabitLogs();
        logs = logs.filter(l => !((l.habit_id === habitId || l.habitId === habitId) && l.date === targetDate));
        this.setHabitLogs(logs);

        const habit = this.getHabit(habitId);
        if (habit) {
            const streak = this.calculateHabitStreak(habitId);
            this.updateHabit(habitId, { streak, current_streak: streak });
        }
        return true;
    }

    static calculateHabitStreak(habitId) {
        const logs = this.getHabitLogs().filter(l => (l.habit_id === habitId || l.habitId === habitId) && l.completed);
        const completedDates = new Set(logs.map(l => l.date));
        let streak = 0;
        let curr = new Date();

        // Check if completed today, if not start check from yesterday
        const todayStr = curr.toISOString().split('T')[0];
        if (!completedDates.has(todayStr)) {
            curr.setDate(curr.getDate() - 1);
        }

        while (true) {
            const dStr = curr.toISOString().split('T')[0];
            if (completedDates.has(dStr)) {
                streak++;
                curr.setDate(curr.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    // ==========================================
    // PLANNER TASKS & TIME BLOCKS
    // ==========================================
    static getTasks() {
        const tasks = this.get('tasks', null);
        if (!tasks || tasks.length === 0) {
            return this.seedDefaultTasks();
        }
        return tasks;
    }

    static setTasks(tasks) {
        return this.set('tasks', tasks);
    }

    static getTask(id) {
        return this.getTasks().find(t => t.id === id) || null;
    }

    static addTask(task) {
        const tasks = this.getTasks();
        const today = new Date().toISOString().split('T')[0];
        const newTask = {
            id: 't-' + Date.now(),
            title: task.title || 'Untitled Task',
            notes: task.notes || task.description || '',
            category: task.category || 'Productivity',
            priority: task.priority || 'medium', // high, medium, low
            status: task.status || 'pending', // pending, completed
            due_date: task.dueDate || task.due_date || today,
            due_time: task.dueTime || task.due_time || '09:00',
            duration: parseInt(task.duration || 45, 10), // in minutes
            is_top_3: task.isTop3 || task.is_top_3 || false,
            created_at: new Date().toISOString()
        };
        tasks.push(newTask);
        this.setTasks(tasks);
        return newTask;
    }

    static updateTask(id, updates) {
        const tasks = this.getTasks();
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], ...updates };
            this.setTasks(tasks);
            return tasks[idx];
        }
        return null;
    }

    static deleteTask(id) {
        const tasks = this.getTasks().filter(t => t.id !== id);
        this.setTasks(tasks);
        return true;
    }

    static toggleTaskStatus(id) {
        const task = this.getTask(id);
        if (task) {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            return this.updateTask(id, { status: newStatus });
        }
        return null;
    }

    // ==========================================
    // STRATEGIC GOALS & MILESTONES
    // ==========================================
    static getGoals() {
        const goals = this.get('goals', null);
        if (!goals || goals.length === 0) {
            return this.seedDefaultGoals();
        }
        return goals;
    }

    static setGoals(goals) {
        return this.set('goals', goals);
    }

    static getGoal(id) {
        return this.getGoals().find(g => g.id === id) || null;
    }

    static addGoal(goal) {
        const goals = this.getGoals();
        const newGoal = {
            id: 'g-' + Date.now(),
            title: goal.title || 'New Goal',
            description: goal.description || '',
            category: goal.category || 'Personal',
            deadline: goal.deadline || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
            progress: parseInt(goal.progress || 0, 10),
            milestones: goal.milestones || [],
            related_habits: goal.related_habits || goal.relatedHabits || [],
            color: goal.color || '#84cc16',
            created_at: new Date().toISOString()
        };
        // Compute initial progress based on milestones if present
        if (newGoal.milestones.length > 0) {
            const completed = newGoal.milestones.filter(m => m.completed).length;
            newGoal.progress = Math.round((completed / newGoal.milestones.length) * 100);
        }
        goals.push(newGoal);
        this.setGoals(goals);
        return newGoal;
    }

    static updateGoal(id, updates) {
        const goals = this.getGoals();
        const idx = goals.findIndex(g => g.id === id);
        if (idx !== -1) {
            const updated = { ...goals[idx], ...updates };
            if (updated.milestones && updated.milestones.length > 0) {
                const completed = updated.milestones.filter(m => m.completed).length;
                updated.progress = Math.round((completed / updated.milestones.length) * 100);
            }
            goals[idx] = updated;
            this.setGoals(goals);
            return goals[idx];
        }
        return null;
    }

    static deleteGoal(id) {
        const goals = this.getGoals().filter(g => g.id !== id);
        this.setGoals(goals);
        return true;
    }

    static toggleMilestone(goalId, milestoneId) {
        const goal = this.getGoal(goalId);
        if (goal && goal.milestones) {
            const ms = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
            return this.updateGoal(goalId, { milestones: ms });
        }
        return null;
    }

    // ==========================================
    // DAILY JOURNALS & REFLECTIONS
    // ==========================================
    static getJournals() {
        const journals = this.get('journals', null);
        if (!journals || journals.length === 0) {
            return this.seedDefaultJournals();
        }
        return journals;
    }

    static setJournals(journals) {
        return this.set('journals', journals);
    }

    static getJournalForDate(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return this.getJournals().find(j => j.date === targetDate) || null;
    }

    static saveJournal(date, payload) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const journals = this.getJournals();
        const idx = journals.findIndex(j => j.date === targetDate);
        let entry;
        if (idx > -1) {
            const curr = journals[idx];
            entry = {
                ...curr,
                mood: payload.mood !== undefined ? payload.mood : curr.mood,
                morning_reflection: {
                    ...curr.morning_reflection,
                    ...(payload.morning || payload.morning_reflection || {})
                },
                evening_reflection: {
                    ...curr.evening_reflection,
                    ...(payload.evening || payload.evening_reflection || {})
                },
                notes: payload.notes !== undefined ? payload.notes : curr.notes,
                updated_at: new Date().toISOString()
            };
            journals[idx] = entry;
        } else {
            entry = {
                id: 'j-' + Date.now(),
                date: targetDate,
                mood: payload.mood || 'awesome',
                morning_reflection: payload.morning || payload.morning_reflection || {
                    accomplish: '',
                    feel: '',
                    grateful: ''
                },
                evening_reflection: payload.evening || payload.evening_reflection || {
                    accomplishments: '',
                    went_well: '',
                    improvements: ''
                },
                notes: payload.notes || '',
                created_at: new Date().toISOString()
            };
            journals.push(entry);
        }
        this.setJournals(journals);
        return entry;
    }

    // ==========================================
    // TOP 3 PRIORITIES (DAILY FOCUS)
    // ==========================================
    static getPriorities() {
        return this.get('priorities', [
            { id: 1, text: 'Complete Morning Deep Work Session (90 min)', completed: true },
            { id: 2, text: 'Ship STREAKO Redesign UI & Verify Flows', completed: true },
            { id: 3, text: 'Evening 5km Zone-2 Run & Stretch', completed: false }
        ]);
    }

    static setPriorities(priorities) {
        return this.set('priorities', priorities);
    }

    // ==========================================
    // BACKUP, IMPORT, EXPORT, RESET
    // ==========================================
    static exportAllData() {
        const payload = {
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            user: this.getUser(),
            habits: this.getHabits(),
            habit_logs: this.getHabitLogs(),
            tasks: this.getTasks(),
            goals: this.getGoals(),
            journals: this.getJournals(),
            priorities: this.getPriorities()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `streako_dailyos_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    static importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (data.user) this.setUser(data.user);
            if (data.habits) this.setHabits(data.habits);
            if (data.habit_logs) this.setHabitLogs(data.habit_logs);
            if (data.tasks) this.setTasks(data.tasks);
            if (data.goals) this.setGoals(data.goals);
            if (data.journals) this.setJournals(data.journals);
            if (data.priorities) this.setPriorities(data.priorities);
            return true;
        } catch (e) {
            console.error('[Storage Error] Import failed:', e);
            return false;
        }
    }

    static resetToDefault() {
        this.remove('user');
        this.remove('habits');
        this.remove('habit_logs');
        this.remove('tasks');
        this.remove('goals');
        this.remove('journals');
        this.remove('priorities');
        this.seedDefaultHabits();
        this.seedDefaultTasks();
        this.seedDefaultGoals();
        this.seedDefaultJournals();
        return true;
    }

    // ==========================================
    // REALISTIC DEFAULT SEED DATA
    // ==========================================
    static seedDefaultHabits() {
        const defaultHabits = [
            { id: 'h-1', name: 'Morning Deep Workout', description: '30-45 min functional resistance and core training', category: 'Fitness', icon: '💪', accentColor: '#84cc16', color: '#84cc16', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 14, current_streak: 14, bestStreak: 32, best_streak: 32, active: true, paused: false, startTime: '06:30', endTime: '07:15', sessions: [{ startTime: '06:30', endTime: '07:15' }] },
            { id: 'h-2', name: 'Mindful Meditation & Breathwork', description: '15 min Box breathing and Headspace mindfulness', category: 'Mindfulness', icon: '🧘', accentColor: '#06b6d4', color: '#06b6d4', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 8, current_streak: 8, bestStreak: 21, best_streak: 21, active: true, paused: false, startTime: '07:30', endTime: '07:45', sessions: [{ startTime: '07:30', endTime: '07:45' }] },
            { id: 'h-3', name: 'Deep Work Sprint (No Phone)', description: '90 min uninterrupted product architecture & execution', category: 'Productivity', icon: '⚡', accentColor: '#a855f7', color: '#a855f7', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 12, current_streak: 12, bestStreak: 28, best_streak: 28, active: true, paused: false, startTime: '09:00', endTime: '10:30', sessions: [{ startTime: '09:00', endTime: '10:30' }] },
            { id: 'h-4', name: 'Optimal Hydration (3.5L)', description: 'Drink mineral water with electrolytes through the day', category: 'Health', icon: '💧', accentColor: '#3b82f6', color: '#3b82f6', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 22, current_streak: 22, bestStreak: 45, best_streak: 45, active: true, paused: false, startTime: '08:00', endTime: '20:00', sessions: [{ startTime: '08:00', endTime: '20:00' }] },
            { id: 'h-5', name: 'Read 25 Pages (Non-Fiction)', description: 'Atomic Habits & Designing Data-Intensive Applications', category: 'Learning', icon: '📚', accentColor: '#f59e0b', color: '#f59e0b', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 9, current_streak: 9, bestStreak: 18, best_streak: 18, active: true, paused: false, startTime: '21:00', endTime: '21:40', sessions: [{ startTime: '21:00', endTime: '21:40' }] },
            { id: 'h-6', name: 'Evening Reflection & Shutdown', description: 'Log wins, gratitude, and prepare tomorrow\'s Top 3', category: 'Mindfulness', icon: '✍️', accentColor: '#f43f5e', color: '#f43f5e', frequency: 'Daily', frequencyLabel: 'Daily', dailyTarget: 1, target: 1, streak: 6, current_streak: 6, bestStreak: 15, best_streak: 15, active: true, paused: false, startTime: '22:00', endTime: '22:15', sessions: [{ startTime: '22:00', endTime: '22:15' }] }
        ];
        this.setHabits(defaultHabits);

        // Generate 30 days of realistic past completions for heatmaps & charts
        const logs = [];
        const today = new Date();
        defaultHabits.forEach(h => {
            const completionRatio = h.streak > 10 ? 0.88 : 0.72;
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                if (i <= h.streak || Math.random() < completionRatio) {
                    logs.push({
                        id: `log-${h.id}-${dStr}`,
                        habit_id: h.id,
                        habitId: h.id,
                        date: dStr,
                        completed: true,
                        created_at: d.toISOString()
                    });
                }
            }
        });
        this.setHabitLogs(logs);
        return defaultHabits;
    }

    static seedDefaultTasks() {
        const today = new Date().toISOString().split('T')[0];
        const defaultTasks = [
            { id: 't-1', title: 'Review DailyOS Habit Engine Architecture', notes: 'Check state synchronization, chart performance, and UI responsiveness', category: 'Productivity', priority: 'high', status: 'completed', due_date: today, due_time: '08:30', duration: 45, is_top_3: true, created_at: new Date().toISOString() },
            { id: 't-2', title: 'Deep Work: Polish Calendar & Goals Views', notes: 'Implement responsive milestone progress bars and day inspection drawer', category: 'Career', priority: 'high', status: 'completed', due_date: today, due_time: '10:00', duration: 90, is_top_3: true, created_at: new Date().toISOString() },
            { id: 't-3', title: 'Focus Sprint: Connect Analytics & Journaling', notes: 'Ensure SVG completion trend chart and mood tracking are reactive', category: 'Productivity', priority: 'medium', status: 'pending', due_date: today, due_time: '14:00', duration: 60, is_top_3: true, created_at: new Date().toISOString() },
            { id: 't-4', title: 'Team Sync & Product Strategy Alignment', notes: 'Discuss Q4 roadmap milestones and habit retention metrics', category: 'Career', priority: 'medium', status: 'pending', due_date: today, due_time: '16:00', duration: 45, is_top_3: false, created_at: new Date().toISOString() },
            { id: 't-5', title: 'Evening Zone-2 Cardio & Mobility Routine', notes: 'Outdoor 5km recovery run + 15 min hip and spine mobility', category: 'Fitness', priority: 'low', status: 'pending', due_date: today, due_time: '18:30', duration: 45, is_top_3: false, created_at: new Date().toISOString() }
        ];
        this.setTasks(defaultTasks);
        return defaultTasks;
    }

    static seedDefaultGoals() {
        const defaultGoals = [
            {
                id: 'g-1',
                title: 'Master Consistent Athletic Fitness & Stamina',
                description: 'Build a durable, high-energy physique by training 5x/week, sleeping 8h, and completing a 10km run.',
                category: 'Fitness',
                deadline: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
                progress: 75,
                color: '#84cc16',
                milestones: [
                    { id: 'm-1', title: 'Maintain a 21-day continuous workout streak', completed: true },
                    { id: 'm-2', title: 'Hit sub-25 min 5K outdoor run pace', completed: true },
                    { id: 'm-3', title: 'Complete 10km endurance checkpoint with <150bpm heart rate', completed: true },
                    { id: 'm-4', title: 'Execute 10 clean pull-ups with full range of motion', completed: false }
                ],
                related_habits: ['h-1', 'h-4']
            },
            {
                id: 'g-2',
                title: 'Launch Next-Gen Productivity Ecosystem',
                description: 'Design and ship the ultra-fast STREAKO DailyOS app with instant client offline state and analytics.',
                category: 'Career',
                deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
                progress: 80,
                color: '#06b6d4',
                milestones: [
                    { id: 'm-5', title: 'Design dark obsidian design system tokens & layout', completed: true },
                    { id: 'm-6', title: 'Implement full 8-page Habit-Bay suite with unified storage', completed: true },
                    { id: 'm-7', title: 'Verify interactive state, chart visualizations, and calendar', completed: true },
                    { id: 'm-8', title: 'Deploy to live production and gather beta user feedback', completed: false }
                ],
                related_habits: ['h-3']
            },
            {
                id: 'g-3',
                title: 'Read 12 High-Impact Non-Fiction Books',
                description: 'Absorb deep insights across system thinking, behavioral psychology, and high performance.',
                category: 'Learning',
                deadline: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
                progress: 50,
                color: '#f59e0b',
                milestones: [
                    { id: 'm-9', title: 'Read Atomic Habits by James Clear', completed: true },
                    { id: 'm-10', title: 'Read Deep Work by Cal Newport', completed: true },
                    { id: 'm-11', title: 'Read Thinking in Systems by Donella Meadows', completed: false },
                    { id: 'm-12', title: 'Read High Output Management by Andy Grove', completed: false }
                ],
                related_habits: ['h-5']
            }
        ];
        this.setGoals(defaultGoals);
        return defaultGoals;
    }

    static seedDefaultJournals() {
        const today = new Date().toISOString().split('T')[0];
        const defaultJournals = [
            {
                id: 'j-1',
                date: today,
                mood: 'awesome',
                morning_reflection: {
                    accomplish: 'Design and ship the upgraded STREAKO 8-page experience with perfect habit & planner sync.',
                    feel: 'Focused, disciplined, and full of positive momentum.',
                    grateful: 'Great health, morning coffee, clear priorities, and rewarding creative work.'
                },
                evening_reflection: {
                    accomplishments: 'Shipped the full DailyOS aesthetic across Today, Planner, Habits, Goals, and Analytics.',
                    went_well: 'Protected 90 minutes of deep uninterrupted work without notifications.',
                    improvements: 'Take more standing stretch breaks during the afternoon sprint.'
                },
                notes: 'Consistency is the compounding engine of high achievement.'
            }
        ];
        this.setJournals(defaultJournals);
        return defaultJournals;
    }
}

// Auto-seed if running in browser
if (typeof window !== 'undefined') {
    Storage.getHabits();
    Storage.getTasks();
    Storage.getGoals();
    Storage.getJournals();
}

export default Storage;
