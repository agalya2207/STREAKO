// STREAKO - DATE UTILITIES

export class DateUtils {
    static today() {
        const date = new Date();
        return this.formatDate(date);
    }

    static formatDate(date) {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    static formatDateReadable(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getDayOfWeek(date) {
        return new Date(date).getDay();
    }

    static getDayName(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { weekday: 'long' });
    }

    static getDayNameShort(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { weekday: 'short' });
    }

    static getMonthName(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { month: 'long' });
    }

    static getMonthNameShort(date, locale = 'en-US') {
        return new Date(date).toLocaleDateString(locale, { month: 'short' });
    }

    static getStartOfWeek(date, startDay = 1) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : startDay);
        return new Date(d.setDate(diff));
    }

    static getEndOfWeek(date, startDay = 1) {
        const endDate = new Date(this.getStartOfWeek(date, startDay));
        endDate.setDate(endDate.getDate() + 6);
        return endDate;
    }

    static getStartOfMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    static getEndOfMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    static getDaysInMonth(date) {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    }

    static addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    static subtractDays(date, days) {
        return this.addDays(date, -days);
    }

    static isToday(date) {
        return this.formatDate(date) === this.today();
    }

    static isPast(date) {
        return new Date(date) < new Date(this.today());
    }

    static isFuture(date) {
        return new Date(date) > new Date(this.today());
    }

    static getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const time = Math.abs(d2 - d1);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    static isSameDay(date1, date2) {
        return this.formatDate(date1) === this.formatDate(date2);
    }

    static getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    static daysSince(date) {
        const today = new Date(this.today());
        const pastDate = new Date(date);
        const time = Math.abs(today - pastDate);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    static daysUntil(date) {
        const today = new Date(this.today());
        const futureDate = new Date(date);
        const time = Math.abs(futureDate - today);
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }

    static isCurrentWeek(date) {
        const weekStart = this.getStartOfWeek(this.today());
        const weekEnd = this.getEndOfWeek(this.today());
        const checkDate = new Date(date);
        return checkDate >= weekStart && checkDate <= weekEnd;
    }

    static isCurrentMonth(date) {
        const today = new Date(this.today());
        const checkDate = new Date(date);
        return today.getFullYear() === checkDate.getFullYear() &&
               today.getMonth() === checkDate.getMonth();
    }

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

    static parseDate(dateString) {
        return new Date(dateString + 'T00:00:00');
    }

    static getMidnight(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    static getEndOfDay(date) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }
}

export default DateUtils;
