import { Router } from './router.js';
import { state } from './state.js';
import { Storage } from './storage.js';

class App {
    constructor() {
        this.router = new Router();
        this.storage = Storage;
        this.state = state;
    }

    init() {
        // Expose global app instance for legacy inline handlers (onclick)
        window.app = this;
        window.goToPage = (pageId) => {
            const routeMap = {
                'landing': '/landing',
                'signup': '/signup',
                'login': '/login',
                'role-selection': '/role-selection',
                'onboarding': '/onboarding',
                'dashboard': '/dashboard',
                'habits-library': '/habits-library',
                'timeline': '/timeline',
                'calendar': '/calendar',
                'goals': '/goals',
                'analytics': '/analytics',
                'journal': '/journal',
                'mentor-dashboard': '/mentor-dashboard',
                'settings': '/settings'
            };
            this.router.navigate(routeMap[pageId] || '/');
        };

        window.selectRole = (element, roleType) => {
            element.parentElement.querySelectorAll('.role-option-card').forEach(card => {
                if (card !== element) card.classList.remove('selected');
            });
            element.classList.add('selected');
        };

        window.markRecovered = () => {
            const card = document.getElementById('recovery-card');
            if (card) {
                card.innerHTML = '<div style="display: flex; gap: 16px; align-items: center;"><div style="font-size: 28px;">✅</div><div class="recovery-text"><strong>Streak Recovered!</strong> "Meditation" is back on track. Your Comeback Rate just went up.</div></div>';
                setTimeout(() => { card.style.display = 'none'; }, 2500);
            }
        };

        window.updateDashboardSubtitle = () => {
            const boxes = document.querySelectorAll('.priority-checkbox');
            const remaining = Array.from(boxes).filter(b => !b.checked).length;
            const subtitle = document.getElementById('dashboard-subtitle');
            if (subtitle) {
                const messages = {
                    3: "3 habits left today — you're closer than you think 🔥",
                    2: "2 habits left today — keep the momentum going 💪",
                    1: "1 habit left today — you're almost there ⚡",
                    0: "All done for today — perfect record! 🎉"
                };
                subtitle.textContent = messages[remaining] || messages[3];
            }
        };

        // Trigger initial route match based on current path
        const currentPath = window.location.pathname === '/' ? '/landing' : window.location.pathname;
        this.router.handleRoute(currentPath);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
