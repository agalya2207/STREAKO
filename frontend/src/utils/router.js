/**
 * Client-side Router for SPA page fetching and injection
 */
export class Router {
    constructor(routes = {}, appContainerId = 'app') {
        this.routes = routes;
        this.container = document.getElementById(appContainerId);
        
        window.addEventListener('popstate', () => this.handleRoute(window.location.pathname));
    }

    async navigate(path) {
        window.history.pushState({}, '', path);
        await this.handleRoute(path);
    }

    async handleRoute(path) {
        // Map paths to HTML files
        const routeMap = {
            '/': 'landing.html',
            '/landing': 'landing.html',
            '/signup': 'signup.html',
            '/login': 'login.html',
            '/role-selection': 'role-selection.html',
            '/onboarding': 'onboarding.html',
            '/dashboard': 'dashboard.html',
            '/habits-library': 'habits-library.html',
            '/timeline': 'timeline.html',
            '/calendar': 'calendar.html',
            '/goals': 'goals.html',
            '/analytics': 'analytics.html',
            '/journal': 'journal.html',
            '/mentor-dashboard': 'mentor-dashboard.html',
            '/settings': 'settings.html'
        };

        const pageFile = routeMap[path] || 'landing.html';
        console.log(`[Router] Navigating to "${path}" -> fetching /pages/${pageFile}`);

        try {
            const response = await fetch(`/pages/${pageFile}`);
            if (!response.ok) throw new Error(`Page not found: ${pageFile} (status ${response.status})`);
            const html = await response.text();
            console.log(`[Router] Successfully fetched ${pageFile} (${html.length} bytes)`);

            this.container.innerHTML = html;

            // Ensure any top-level .page element inside #app has the 'active' class so it is visible
            const pages = this.container.querySelectorAll('.page');
            if (pages.length > 0) {
                pages.forEach(p => p.classList.add('active'));
            } else if (this.container.firstElementChild) {
                this.container.firstElementChild.classList.add('active');
            }

            window.scrollTo(0, 0);
            
            // Dispatch event for page scripts to hook into
            const event = new CustomEvent('page-loaded', { detail: { path, pageFile } });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('[Router] Routing error:', error);
            this.container.innerHTML = `<div style="padding: 32px; color: red;">Error loading page: ${error.message}</div>`;
        }
    }
}

export default Router;
