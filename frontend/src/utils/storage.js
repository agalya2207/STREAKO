import { DateUtils } from './dates.js';

export class Storage {
    static PREFIX = 'streako_';

    /**
     * Save data to LocalStorage
     */
    static set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.PREFIX + key, serialized);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    /**
     * Get data from LocalStorage
     */
    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage error:', e);
            return defaultValue;
        }
    }

    /**
     * Remove data from LocalStorage
     */
    static remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    static exists(key) {
        return localStorage.getItem(this.PREFIX + key) !== null;
    }

    /**
     * Clear all Streako data
     */
    static clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    /**
     * Get all Streako data
     */
    static getAll() {
        try {
            const data = {};
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    const cleanKey = key.replace(this.PREFIX, '');
                    data[cleanKey] = this.get(cleanKey);
                }
            });
            return data;
        } catch (e) {
            console.error('Storage error:', e);
            return {};
        }
    }

    /**
     * Backup all data
     */
    static backup() {
        return JSON.stringify(this.getAll());
    }

    /**
     * Restore from backup
     */
    static restore(backup) {
        try {
            this.clear();
            const data = JSON.parse(backup);
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            return true;
        } catch (e) {
            console.error('Restore error:', e);
            return false;
        }
    }

    /**
     * Export data as JSON file
     */
    static exportAsFile() {
        const data = this.backup();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `streako-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import data from file
     */
    static importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = e.target.result;
                    this.restore(backup);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Get storage size
     */
    static getSize() {
        let size = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                size += localStorage.getItem(key).length;
            }
        });
        return size;
    }

    /**
     * USER DATA OPERATIONS */

    /**
     * Save user profile
     */
    static setUser(user) {
        return this.set('user', user);
    }

    /**
     * Get user profile
     */
    static getUser() {
        return this.get('user', this.getDefaultUser());
    }

    /**
     * Get default user object
     */
    static getDefaultUser() {
        return {
            id: 'user_' + Date.now(),
            name: 'John Doe',
            email: 'john@email.com',
            avatar: 'JD',
            timezone: 'Asia/Kolkata',
            theme: 'dark',
            weekStart: 'monday',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * HABITS DATA OPERATIONS */

    /**
     * Save all habits
     */
    static setHabits(habits) {
        return this.set('habits', habits);
    }

    /**
     * Get all habits
     */
    static getHabits() {
        let habits = this.get('habits', []);
        let modified = false;
        const seenIds = new Set();

        habits = habits.map((h, idx) => {
            if (!h || typeof h !== 'object') return h;
            if (!h.id || seenIds.has(h.id)) {
                modified = true;
                const uniqueId = 'habit_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 6);
                return { ...h, id: uniqueId };
            }
            seenIds.add(h.id);
            return h;
        });

        if (modified) {
            this.setHabits(habits);
        }

        return habits;
    }

    /**
     * Add new habit
     */
    static addHabit(habit) {
        const habits = this.getHabits();
        const id = habit.id || ('habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        const newHabit = {
            completions: [],
            ...habit,
            id,
            createdAt: habit.createdAt || new Date().toISOString()
        };
        habits.push(newHabit);
        this.setHabits(habits);
        return newHabit;
    }

    /**
     * Update habit
     */
    static updateHabit(habitId, updates) {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates };
            this.setHabits(habits);
            return habits[index];
        }
        return null;
    }

    /**
     * Delete habit
     */
    static deleteHabit(habitId) {
        const habits = this.getHabits();
        const filtered = habits.filter(h => h.id !== habitId);
        this.setHabits(filtered);
        return filtered;
    }

    /**
     * Get habit by ID
     */
    static getHabit(habitId) {
        const habits = this.getHabits();
        return habits.find(h => h.id === habitId) || null;
    }

    /**
     * COMPLETIONS OPERATIONS */

    /**
     * Mark habit as completed for a date
     */
    static markCompleted(habitId, date) {
        const habit = this.getHabit(habitId);
        if (habit) {
            if (!habit.completions) habit.completions = [];
            if (!habit.completions.includes(date)) {
                habit.completions.push(date);
            }
            this.updateHabit(habitId, { completions: habit.completions });
            return true;
        }
        return false;
    }

    /**
     * Unmark habit completion
     */
    static unmarkCompleted(habitId, date) {
        const habit = this.getHabit(habitId);
        if (habit && habit.completions) {
            habit.completions = habit.completions.filter(d => d !== date);
            this.updateHabit(habitId, { completions: habit.completions });
            return true;
        }
        return false;
    }

    /**
     * Check if habit completed on date
     */
    static isCompleted(habitId, date) {
        const habit = this.getHabit(habitId);
        return habit && habit.completions && habit.completions.includes(date);
    }

    /**
     * Get today's completions
     */
    static getTodayCompletions() {
        const today = DateUtils.today();
        const habits = this.getHabits();
        return habits.filter(h => this.isCompleted(h.id, today));
    }

    /**
     * Get completions for date
     */
    static getCompletionsForDate(date) {
        const habits = this.getHabits();
        return habits.filter(h => this.isCompleted(h.id, date));
    }

    /**
     * JOURNAL OPERATIONS */

    /**
     * Save journal entries
     */
    static setJournal(entries) {
        return this.set('journal', entries);
    }

    /**
     * Get journal entries
     */
    static getJournal() {
        return this.get('journal', []);
    }

    /**
     * Add journal entry
     */
    static addJournalEntry(entry) {
        const journal = this.getJournal();
        const newEntry = {
            id: 'entry_' + Date.now(),
            ...entry,
            createdAt: new Date().toISOString()
        };
        journal.push(newEntry);
        this.setJournal(journal);
        return newEntry;
    }

    /**
     * SETTINGS OPERATIONS */

    /**
     * Save app settings
     */
    static setSettings(settings) {
        return this.set('settings', settings);
    }

    /**
     * Get app settings
     */
    static getSettings() {
        return this.get('settings', this.getDefaultSettings());
    }

    /**
     * Get default settings
     */
    static getDefaultSettings() {
        return {
            theme: 'dark',
            notifications: true,
            weekStart: 'monday',
            language: 'en',
            timeFormat: '24h'
        };
    }

    /**
     * Update single setting
     */
    static updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.setSettings(settings);
    }

    /**
     * ANALYTICS OPERATIONS */

    /**
     * Get completion statistics
     */
    static getStatistics(habitId, days = 30) {
        const habit = this.getHabit(habitId);
        if (!habit) return null;

        let completed = 0;
        let skipped = 0;

        for (let i = 0; i < days; i++) {
            const date = DateUtils.formatDate(DateUtils.subtractDays(DateUtils.today(), i));
            if (this.isCompleted(habitId, date)) {
                completed++;
            } else {
                skipped++;
            }
        }

        return {
            habitId: habitId,
            period: days,
            completed: completed,
            skipped: skipped,
            percentage: Math.round((completed / days) * 100)
        };
    }
}

// Initialize default data if first time
if (typeof window !== 'undefined' && window.localStorage) {
    if (!Storage.exists('user')) {
        Storage.setUser(Storage.getDefaultUser());
    }

    if (!Storage.exists('settings')) {
        Storage.setSettings(Storage.getDefaultSettings());
    }
}

export default Storage;
