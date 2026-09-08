/**
 * Global Application State Management
 */
export class State {
    constructor() {
        this.currentUser = null;
        this.currentPath = '/';
        this.listeners = new Set();
    }

    setUser(user) {
        this.currentUser = user;
        this.notify();
    }

    setPath(path) {
        this.currentPath = path;
        this.notify();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this));
    }
}

export const state = new State();
export default state;
