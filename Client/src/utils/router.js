// Production Router - Clean and robust
export class Router {
    constructor(app) {
        this.app = app;
        this.routes = new Map();
        this.currentRoute = null;
        this.isNavigating = false;
        // Don't auto-initialize, let app control when to init
    }

    // Add a route
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    // Navigate to a route
    navigate(path) {
        if (!path || typeof path !== 'string') {
            console.warn(`Invalid path provided to navigate: ${path}, redirecting to landing`);
            path = 'landing';
        }
        
        console.log(`🚀 Navigating to: ${path}`);
        
        // Prevent navigation loops
        if (this.isNavigating) {
            console.warn('Navigation already in progress, ignoring:', path);
            return null;
        }
        
        // Clean the path
        const cleanPath = this.cleanPath(path);
        
        // Skip if already on this route (but allow re-rendering if needed)
        if (this.currentRoute === cleanPath && document.querySelector('#app').innerHTML.trim()) {
            console.log(`Already on route: ${cleanPath}, skipping navigation`);
            return null;
        }
        
        this.isNavigating = true;
        
        // Update URL
        this.updateURL(cleanPath);
        
        // Find and execute route handler
        const handler = this.routes.get(cleanPath);
        if (handler) {
            this.currentRoute = cleanPath;
            console.log(`✅ Route found: ${cleanPath}`);
            try {
                const content = handler();
                
                // Handle both async and sync route handlers
                if (content instanceof Promise) {
                    content
                        .then(asyncContent => {
                            if (asyncContent && typeof asyncContent === 'string' && asyncContent.trim()) {
                                this.app.renderPage(asyncContent);
                            } else {
                                console.error(`Async route handler for ${cleanPath} returned invalid content:`, asyncContent);
                                this.handleRouteError();
                            }
                        })
                        .catch(error => {
                            console.error('Async route handler error:', error);
                            this.handleRouteError();
                        })
                        .finally(() => {
                            this.isNavigating = false;
                        });
                    
                    // Return loading state for async routes
                    const loadingContent = `
                        <div class="min-h-screen flex items-center justify-center">
                            <div class="text-center">
                                <h2 class="text-2xl font-semibold text-white mb-4">Loading...</h2>
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                            </div>
                        </div>
                    `;
                    this.app.renderPage(loadingContent);
                    return loadingContent;
                } else {
                    // Handle synchronous content
                    if (content && typeof content === 'string' && content.trim()) {
                        this.app.renderPage(content);
                    } else {
                        console.error(`Route handler for ${cleanPath} returned invalid content:`, content);
                        this.isNavigating = false;
                        return this.handleRouteError();
                    }
                    this.isNavigating = false;
                    return content;
                }
            } catch (error) {
                console.error('Route handler error:', error);
                this.isNavigating = false;
                return this.handleRouteError();
            }
        } else {
            console.warn(`❌ Route not found: ${cleanPath}`);
            console.log('Available routes:', Array.from(this.routes.keys()));
            this.isNavigating = false;
            return this.handleNotFound(cleanPath);
        }
    }

    // Clean path
    cleanPath(path) {
        if (!path || typeof path !== 'string') {
            console.warn('Invalid path provided to cleanPath:', path);
            return 'landing';
        }
        return path.replace(/^\/+|\/+$/g, '') || 'landing';
    }

    // Update browser URL
    updateURL(path) {
        // Preserve query parameters when updating URL
        const currentSearch = window.location.search;
        const url = path === 'landing' ? '/' : `/${path}${currentSearch}`;
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

    // Handle 404 errors
    handleNotFound(cleanPath) {
        console.warn(`❌ Route not found: ${cleanPath}, showing 404 page`);
        // Try to navigate to 404 page
        const notFoundHandler = this.routes.get('404');
        if (notFoundHandler && cleanPath !== '404') {
            this.currentRoute = '404';
            const content = notFoundHandler();
            if (content) {
                this.app.renderPage(content);
            }
            return content;
        }
        
        // Fallback error content
        const errorContent = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
                    <h2 class="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                    <p class="text-gray-300 mb-8">The page you're looking for doesn't exist.</p>
                    <button
                        onclick="window.app.navigate('${this.app.user ? 'dashboard' : 'landing'}')"
                        class="btn-primary"
                    >
                        ${this.app.user ? 'Go to Dashboard' : 'Go Home'}
                    </button>
                </div>
            </div>
        `;
        this.app.renderPage(errorContent);
        return errorContent;
    }

    // Handle route errors
    handleRouteError() {
        const errorContent = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-red-400 mb-4">Error</h1>
                    <h2 class="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
                    <p class="text-gray-300 mb-8">There was an error loading this page.</p>
                    <button
                        onclick="window.app.navigate('landing')"
                        class="btn-primary"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        `;
        this.app.renderPage(errorContent);
        return errorContent;
    }
}
