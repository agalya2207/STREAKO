// STREAKO - FORMATTING UTILITIES

export class FormattingUtils {
    /**
     * Capitalize first letter
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Capitalize all words
     */
    static capitalizeWords(str) {
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    }

    /**
     * Convert to slug format (kebab-case)
     */
    static toSlug(str) {
        return str.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Format number with thousands separator
     */
    static formatNumber(num, locale = 'en-US') {
        return new Intl.NumberFormat(locale).format(num);
    }

    /**
     * Format currency
     */
    static formatCurrency(num, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(num);
    }

    /**
     * Format percentage
     */
    static formatPercentage(num, decimals = 0) {
        return (num * 100).toFixed(decimals) + '%';
    }

    /**
     * Format large numbers (1K, 1M, 1B)
     */
    static formatCompactNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Format bytes to human readable size
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Truncate text with ellipsis
     */
    static truncate(str, length = 50, suffix = '...') {
        if (str.length <= length) return str;
        return str.slice(0, length - suffix.length) + suffix;
    }

    /**
     * Limit lines and add ellipsis
     */
    static truncateLines(str, lines = 2) {
        const lineArray = str.split('\n');
        return lineArray.slice(0, lines).join('\n') + (lineArray.length > lines ? '\n...' : '');
    }

    /**
     * Strip HTML tags
     */
    static stripHTML(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    }

    /**
     * Escape HTML
     */
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

    /**
     * Highlight text
     */
    static highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Convert camelCase to Title Case
     */
    static camelCaseToTitle(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, char => char.toUpperCase())
            .trim();
    }

    /**
     * Convert snake_case to Title Case
     */
    static snakeCaseToTitle(str) {
        return str
            .split('_')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Format phone number
     */
    static formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (!match) return phone;
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }

    /**
     * Format email
     */
    static formatEmail(email) {
        return email.toLowerCase().trim();
    }

    /**
     * Pluralize word
     */
    static pluralize(count, singular, plural = null) {
        if (count === 1) return `1 ${singular}`;
        if (!plural) plural = singular + 's';
        return `${count} ${plural}`;
    }

    /**
     * Create acronym from text
     */
    static createAcronym(text) {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    }

    /**
     * Format time duration
     */
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

    /**
     * Format time (HH:MM:SS)
     */
    static formatTime(seconds) {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    }

    /**
     * Get initials from name
     */
    static getInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    }

    /**
     * Format streak count with emoji
     */
    static formatStreak(count) {
        if (count === 0) return '❌ Broken';
        if (count < 7) return `🔥 ${count} days`;
        if (count < 30) return `🔥 ${Math.floor(count / 7)} weeks`;
        return `🔥 ${Math.floor(count / 30)} months`;
    }

    /**
     * Get completion percentage display
     */
    static formatCompletion(completed, total) {
        const percentage = Math.round((completed / total) * 100);
        return `${percentage}%`;
    }

    /**
     * Format habit status badge
     */
    static getStatusBadge(status) {
        const badges = {
            'completed': '✅ Completed',
            'pending': '⏳ Pending',
            'skipped': '⏭️ Skipped',
            'overdue': '⚠️ Overdue'
        };
        return badges[status] || status;
    }

    /**
     * Random color from primary colors
     */
    static getRandomColor() {
        const colors = ['#2F8FFF', '#10B981', '#FF9F43', '#A78BFA', '#EC4899', '#06B6D4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Get contrast text color for background
     */
    static getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 155 ? '#000000' : '#FFFFFF';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormattingUtils;
}