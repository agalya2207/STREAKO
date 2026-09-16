import App from './App.js';

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  // DOM already loaded (e.g., script loaded after DOM)
  const app = new App();
  app.init();
}

