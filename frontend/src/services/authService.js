import api from './api.js';

export class AuthService {
    static async signup(email, password, fullName) {
        return api.post('/auth/signup', { email, password, fullName });
    }

    static async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        if (response.session && response.session.access_token) {
            localStorage.setItem('streako_auth_token', response.session.access_token);
        }
        if (response.user) {
            localStorage.setItem('streako_user', JSON.stringify(response.user));
        }
        return response;
    }

    static async logout() {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.warn('Logout API warning:', e.message);
        } finally {
            localStorage.removeItem('streako_auth_token');
            localStorage.removeItem('streako_user');
        }
    }

    static async getCurrentUser() {
        return api.get('/auth/me');
    }

    static isAuthenticated() {
        return !!localStorage.getItem('streako_auth_token');
    }
}

export default AuthService;
