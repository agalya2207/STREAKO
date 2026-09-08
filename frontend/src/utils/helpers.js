/**
 * General helper utilities aggregator
 */
import { DateUtils } from './dates.js';
import { FormattingUtils } from './formatting.js';
import { Validators } from './validators.js';

export { DateUtils, FormattingUtils, Validators };

export const debounce = (func, wait = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export const generateId = () => {
    return 'id_' + Math.random().toString(36).substr(2, 9);
};

export default {
    DateUtils,
    FormattingUtils,
    Validators,
    debounce,
    generateId
};
