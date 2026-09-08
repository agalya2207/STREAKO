import api from './api.js';

export class UserService {
    static async getProfile() {
        return api.get('/users/profile');
    }

    static async updateProfile(profileData) {
        return api.put('/users/profile', profileData);
    }
}

export default UserService;
