// STREAKO - VALIDATION UTILITIES

export class Validators {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static isStrongPassword(password) {
        if (password.length < 8) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        if (!/[!@#$%^&*]/.test(password)) return false;
        return true;
    }

    /**
     * Get password strength level
     */
    static getPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;

        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return levels[Math.min(strength, 5)];
    }

    /**
     * Validate phone number
     */
    static isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate URL
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Validate required field
     */
    static isRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    /**
     * Validate minimum length
     */
    static minLength(value, min) {
        return value.toString().trim().length >= min;
    }

    /**
     * Validate maximum length
     */
    static maxLength(value, max) {
        return value.toString().trim().length <= max;
    }

    /**
     * Validate range
     */
    static isInRange(value, min, max) {
        const num = Number(value);
        return num >= min && num <= max;
    }

    /**
     * Validate number
     */
    static isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Validate integer
     */
    static isInteger(value) {
        return Number.isInteger(Number(value));
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    static isValidDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;
        
        const date = new Date(dateString + 'T00:00:00');
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Validate date is in future
     */
    static isFutureDate(dateString) {
        if (!this.isValidDate(dateString)) return false;
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    }

    /**
     * Validate date is in past
     */
    static isPastDate(dateString) {
        if (!this.isValidDate(dateString)) return false;
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    /**
     * Validate username
     */
    static isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * Validate habit name
     */
    static isValidHabitName(name) {
        return this.isRequired(name) && this.minLength(name, 2) && this.maxLength(name, 100);
    }

    /**
     * Validate habit frequency
     */
    static isValidFrequency(frequency) {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'custom'];
        return validFrequencies.includes(frequency.toLowerCase());
    }

    /**
     * Validate color hex code
     */
    static isValidColor(color) {
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        return colorRegex.test(color);
    }

    /**
     * Validate JSON
     */
    static isValidJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Validate array is not empty
     */
    static isNotEmpty(arr) {
        return Array.isArray(arr) && arr.length > 0;
    }

    /**
     * Validate object has required keys
     */
    static hasRequiredKeys(obj, keys) {
        return keys.every(key => key in obj);
    }

    /**
     * Validate form data
     */
    static validateForm(formData, schema) {
        const errors = {};

        for (const [field, rules] of Object.entries(schema)) {
            const value = formData[field];

            if (rules.required && !this.isRequired(value)) {
                errors[field] = `${field} is required`;
                continue;
            }

            if (rules.email && value && !this.isValidEmail(value)) {
                errors[field] = `${field} must be a valid email`;
            }

            if (rules.minLength && value && !this.minLength(value, rules.minLength)) {
                errors[field] = `${field} must be at least ${rules.minLength} characters`;
            }

            if (rules.maxLength && value && !this.maxLength(value, rules.maxLength)) {
                errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
            }

            if (rules.pattern && value && !rules.pattern.test(value)) {
                errors[field] = rules.patternMessage || `${field} format is invalid`;
            }

            if (rules.custom && value && !rules.custom(value)) {
                errors[field] = rules.customMessage || `${field} is invalid`;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    /**
     * Sanitize input to prevent XSS
     */
    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Validate habit completion data
     */
    static isValidCompletion(completion) {
        return this.isRequired(completion.habitId) &&
               this.isValidDate(completion.date) &&
               typeof completion.completed === 'boolean';
    }

    /**
     * Get validation error message
     */
    static getErrorMessage(field, rule) {
        const messages = {
            required: `${field} is required`,
            email: `${field} must be a valid email`,
            phone: `${field} must be a valid phone number`,
            url: `${field} must be a valid URL`,
            password: `${field} must be at least 8 characters with uppercase, lowercase, number and special character`,
            username: `${field} must be 3-20 characters (letters, numbers, _, -)`,
            minLength: (min) => `${field} must be at least ${min} characters`,
            maxLength: (max) => `${field} must not exceed ${max} characters`,
            number: `${field} must be a number`,
            date: `${field} must be a valid date (YYYY-MM-DD)`,
            futureDate: `${field} must be a future date`,
            pastDate: `${field} must be a past date`
        };

        if (typeof messages[rule] === 'function') {
            return messages[rule];
        }
        return messages[rule] || 'Invalid input';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}