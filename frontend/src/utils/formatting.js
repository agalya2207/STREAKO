// STREAKO - FORMATTING UTILITIES

export class FormattingUtils {
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static capitalizeWords(str) {
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    }

    static toSlug(str) {
        return str.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static formatNumber(num, locale = 'en-US') {
        return new Intl.NumberFormat(locale).format(num);
    }

    static formatCurrency(num, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(num);
    }

    static formatPercentage(num, decimals = 0) {
        return (num * 100).toFixed(decimals) + '%';
    }

    static formatCompactNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    static truncate(str, length = 50, suffix = '...') {
        if (str.length <= length) return str;
        return str.slice(0, length - suffix.length) + suffix;
    }

    static truncateLines(str, lines = 2) {
        const lineArray = str.split('\n');
        return lineArray.slice(0, lines).join('\n') + (lineArray.length > lines ? '\n...' : '');
    }

    static stripHTML(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    }

    static escapeHTML(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, char => map[char]);
    }

    static highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    static camelCaseToTitle(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, char => char.toUpperCase())
            .trim();
    }

    static snakeCaseToTitle(str) {
        return str
            .split('_')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    static formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (!match) return phone;
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    static formatEmail(email) {
        return email.toLowerCase().trim();
    }

    static pluralize(count, singular, plural = null) {
        if (count === 1) return `1 ${singular}`;
        if (!plural) plural = singular + 's';
        return `${count} ${plural}`;
    }

    static createAcronym(text) {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);
        return parts.join(' ') || '0s';
    }

    static formatTime(seconds) {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    }

    static getInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    }

    static formatStreak(count) {
        if (count === 0) return '❌ Broken';
        if (count < 7) return `🔥 ${count} days`;
        if (count < 30) return `🔥 ${Math.floor(count / 7)} weeks`;
        return `🔥 ${Math.floor(count / 30)} months`;
    }

    static formatCompletion(completed, total) {
        const percentage = Math.round((completed / total) * 100);
        return `${percentage}%`;
    }

    static getStatusBadge(status) {
        const badges = {
            'completed': '✅ Completed',
            'pending': '⏳ Pending',
            'skipped': '⏭️ Skipped',
            'overdue': '⚠️ Overdue'
        };
        return badges[status] || status;
    }

    static getRandomColor() {
        const colors = ['#2F8FFF', '#10B981', '#FF9F43', '#A78BFA', '#EC4899', '#06B6D4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155 ? '#000000' : '#FFFFFF';
    }
}

export default FormattingUtils;
