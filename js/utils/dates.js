// STREAKO - DATE UTILITIES

export class DateUtils {
    /**
     * Get today's date
     */
    static today() {
        const date = new Date();
        return this.formatDate(date);
    }

    /**
     * Format date to YYYY-MM-DD
     */
    static formatDate(date) {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    /**
     * Format date to readable format (e.g., "Aug 29, 2024")
     */
    static formatDateReadable(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format date with time (e.g., "Aug 29, 2024 2:30 PM")
     */
    static formatDateTime(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get day of week (0-6, where 0 is Sunday)
     */
    static getDayOfWeek(date) {
        return new Date(date).getDay();
    }

    /**
     * Get day name (e.g., "Monday")
     */
    static getDayName(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { weekday: 'long' });
    }

    /**
     * Get short day name (e.g., "Mon")
     */
    static getDayNameShort(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { weekday: 'short' });
    }

    /**
     * Get month name (e.g., "August")
     */
    static getMonthName(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { month: 'long' });
    }

    /**
     * Get short month name (e.g., "Aug")
     */
    static getMonthNameShort(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { month: 'short' });
    }

    /**
     * Get start of week (Monday by default)
     */
    static getStartOfWeek(date, startDay = 1) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : startDay);
        return new Date(d.setDate(diff));
    }

    /**
     * Get end of week
     */
    static getEndOfWeek(date, startDay = 1) {
        const endDate = new Date(this.getStartOfWeek(date, startDay));
        endDate.setDate(endDate.getDate() + 6);
        return endDate;
    }

    /**
     * Get start of month
     */
    static getStartOfMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    /**
     * Get end of month
     */
    static getEndOfMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    /**
     * Get all days in a month
     */
    static getDaysInMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    }

    /**
     * Add days to date
     */
    static addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    /**
     * Subtract days from date
     */
    static subtractDays(date, days) {
        return this.addDays(date, -days);
    }

    /**
     * Check if date is today
     */
    static isToday(date) {
        return this.formatDate(date) === this.today();
    }

    /**
     * Check if date is in the past
     */
    static isPast(date) {
        return new Date(date) < new Date(this.today());
    }

    /**
     * Check if date is in the future
     */
    static isFuture(date) {
        return new Date(date) > new Date(this.today());
    }

    /**
     * Get difference between two dates in days
     */
    static getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const time = Math.abs(d2 - d1);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if two dates are on the same day
     */
    static isSameDay(date1, date2) {
        return this.formatDate(date1) === this.formatDate(date2);
    }

    /**
     * Get week number of year
     */
    static getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Get days since a date
     */
    static daysSince(date) {
        const today = new Date(this.today());
        const pastDate = new Date(date);
        const time = Math.abs(today - pastDate);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    /**
     * Get days until a date
     */
    static daysUntil(date) {
        const today = new Date(this.today());
        const futureDate = new Date(date);
        const time = Math.abs(futureDate - today);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if date is in current week
     */
    static isCurrentWeek(date) {
        const weekStart = this.getStartOfWeek(this.today());
        const weekEnd = this.getEndOfWeek(this.today());
        const checkDate = new Date(date);
        return checkDate >= weekStart && checkDate <= weekEnd;
    }

    /**
     * Check if date is in current month
     */
    static isCurrentMonth(date) {
        const today = new Date(this.today());
        const checkDate = new Date(date);
        return today.getFullYear() === checkDate.getFullYear() &&
               today.getMonth() === checkDate.getMonth();
    }

    /**
     * Get relative time (e.g., "2 days ago")
     */
    static getRelativeTime(date, locale = 'en-US') {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        const today = new Date(this.today());
        const checkDate = new Date(date);
        const diffMs = checkDate - today;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (Math.abs(diffDays) < 7) {
            return rtf.format(diffDays, 'day');
        }
        
        const diffWeeks = Math.floor(diffDays / 7);
        return rtf.format(diffWeeks, 'week');
    }

    /**
     * Parse date string to Date object
     */
    static parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    }

    /**
     * Get midnight of a date
     */
    static getMidnight(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get end of day
     */
    static getEndOfDay(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}