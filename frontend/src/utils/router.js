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
            '/forgot-password': 'forgot-password.html',
            '/reset-password': 'forgot-password.html',
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
            '/settings': 'settings.html',
            '/purchase-list': 'purchase-list.html'
        };

        const pageFile = routeMap[path] || 'landing.html';
        console.log(`[Router] Navigating to "${path}" -> fetching /pages/${pageFile}`);

        try {
            const response = await fetch(`/pages/${pageFile}`);
            if (!response.ok) throw new Error(`Page not found: ${pageFile} (status ${response.status})`);
            const html = await response.text();
            console.log(`[Router] Successfully fetched ${pageFile} (${html.length} bytes)`);

            // Clean up any previously injected route styles
            document.querySelectorAll('[data-dynamic-route="true"]').forEach(el => el.remove());
            document.body.removeAttribute('style');

            let contentToInject = html;
            if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                doc.head.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
                    const cloned = el.cloneNode(true);
                    cloned.setAttribute('data-dynamic-route', 'true');
                    document.head.appendChild(cloned);
                });
                contentToInject = doc.body.innerHTML;
            }

            this.container.innerHTML = contentToInject;

            // Ensure any top-level .page element inside #app has the 'active' class so it is visible
            const pages = this.container.querySelectorAll('.page');
            if (pages.length > 0) {
                pages.forEach(p => p.classList.add('active'));
            } else if (this.container.firstElementChild) {
                this.container.firstElementChild.classList.add('active');
            }

            // Re-run any scripts in the newly inserted DOM
            const scripts = this.container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });

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
