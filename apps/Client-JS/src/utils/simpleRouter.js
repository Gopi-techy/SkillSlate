// Production Router - Clean and robust
export class Router {
    constructor(app) {
        this.app = app;
        this.routes = new Map();
        this.currentRoute = null;
        // Don't auto-initialize, let app control when to init
    }

    // Add a route
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    // Navigate to a route
    navigate(path) {
        console.log(`🚀 Navigating to: ${path}`);
        
        // Clean the path
        const cleanPath = this.cleanPath(path);
        
        // Update URL
        this.updateURL(cleanPath);
        
        // Find and execute route handler
        const handler = this.routes.get(cleanPath);
        if (handler) {
            this.currentRoute = cleanPath;
            console.log(`✅ Route found: ${cleanPath}`);
            const content = handler();
            this.app.renderPage(content);
            return content;
        } else {
            console.warn(`❌ Route not found: ${cleanPath}`);
            console.log('Available routes:', Array.from(this.routes.keys()));
            
            // Try to navigate to 404 page
            const notFoundHandler = this.routes.get('404');
            if (notFoundHandler) {
                this.currentRoute = '404';
                const content = notFoundHandler();
                this.app.renderPage(content);
                return content;
            }
            
            // Fallback to landing page
            const landingHandler = this.routes.get('landing');
            if (landingHandler) {
                console.log('🔄 Redirecting to landing page');
                this.navigate('landing');
                return;
            }
            
            return null;
        }
    }

    // Clean path
    cleanPath(path) {
        return path.replace(/^\/+|\/+$/g, '') || 'landing';
    }

    // Update browser URL
    updateURL(path) {
        const url = path === 'landing' ? '/' : `/${path}`;
        window.history.pushState({ path }, '', url);
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Initialize router
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const path = event.state?.path || this.getPathFromURL();
            this.navigate(path);
        });

        // Set initial route
        const initialPath = this.getPathFromURL();
        this.navigate(initialPath);
    }

    // Get path from current URL
    getPathFromURL() {
        const path = window.location.pathname.slice(1);
        return this.cleanPath(path);
    }
}
