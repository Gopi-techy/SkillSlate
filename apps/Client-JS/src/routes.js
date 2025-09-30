// Simple Route Configuration
import { LandingPage } from './components/LandingPage.js';
import { AuthPage } from './components/AuthPage.js';
import { Dashboard } from './components/Dashboard.js';
import { CreatePortfolio } from './components/CreatePortfolio.js';
// Templates temporarily removed
// import { TemplatesPage } from './components/TemplatesPage.js';
import { auth } from './utils/auth.js';

export function setupRoutes(app) {
    const router = app.router;
    console.log('🔧 Setting up routes...');

    // Landing Page
    router.addRoute('landing', () => {
        console.log('🏠 Rendering landing page');
        const landingPage = new LandingPage((page) => router.navigate(page));
        window.landingPageComponent = landingPage;
        return landingPage.render();
    });
    console.log('✅ Added landing route');

    // Root path
    router.addRoute('', () => {
        console.log('🏠 Root path handler');
        if (!app.user && auth.isAuthenticated()) app.user = auth.getUser();
        return router.navigate(app.user ? 'dashboard' : 'landing');
    });
    console.log('✅ Added root route');

    // Login Page
    router.addRoute('login', () => {
        console.log('🔐 Rendering login page');
        if (!app.user && auth.isAuthenticated()) app.user = auth.getUser();
        if (app.user) return router.navigate('dashboard');
        
        const authPage = new AuthPage('login', 
            (user) => {
                app.handleAuth(user);
                router.navigate('dashboard');
            },
            (page) => router.navigate(page)
        );
        window.authPageComponent = authPage;
        return authPage.render();
    });
    console.log('✅ Added login route');

    // Signup Page
    router.addRoute('signup', () => {
        console.log('📝 Rendering signup page');
        if (!app.user && auth.isAuthenticated()) app.user = auth.getUser();
        if (app.user) return router.navigate('dashboard');
        
        const authPage = new AuthPage('signup',
            (user) => {
                app.handleAuth(user);
                router.navigate('dashboard');
            },
            (page) => router.navigate(page)
        );
        window.authPageComponent = authPage;
        return authPage.render();
    });
    console.log('✅ Added signup route');

    // Dashboard (Protected)
    router.addRoute('dashboard', () => {
        console.log('📊 Rendering dashboard');
        if (!app.user) {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('currentUser');
            if (token && storedUser) {
                try {
                    app.user = JSON.parse(storedUser);
                    // Ensure API has token for protected calls
                    import('./utils/api.js').then(({ apiService }) => {
                        apiService.setToken(token);
                    });
                } catch (e) {
                    console.warn('Failed to restore session from storage:', e);
                }
            }
            if (!app.user) {
                return router.navigate('login');
            }
        }
        
        const dashboard = new Dashboard(
            app.user,
            () => {
                app.handleAuth(null);
                router.navigate('landing');
            },
            (page) => router.navigate(page)
        );
        window.dashboardComponent = dashboard;
        return dashboard.render();
    });
    console.log('✅ Added dashboard route');

    // Create Portfolio (Protected)
    router.addRoute('create', () => {
        console.log('🎨 Rendering create portfolio');
        if (!app.user) {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('currentUser');
            if (token && storedUser) {
                try {
                    app.user = JSON.parse(storedUser);
                    import('./utils/api.js').then(({ apiService }) => {
                        apiService.setToken(token);
                    });
                } catch (e) {
                    console.warn('Failed to restore session from storage:', e);
                }
            }
            if (!app.user) {
                return router.navigate('login');
            }
        }
        
        const createPortfolio = new CreatePortfolio(
            app.user,
            (page) => router.navigate(page)
        );
        window.createPortfolioComponent = createPortfolio;
        return createPortfolio.render();
    });
    console.log('✅ Added create route');

    // Templates route removed

    // 404 Handler
    router.addRoute('404', () => {
        console.log('❌ Rendering 404 page');
        return `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
                    <h2 class="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                    <p class="text-gray-300 mb-8">The page you're looking for doesn't exist.</p>
                    <button
                        onclick="window.app.navigate('landing')"
                        class="btn-primary"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        `;
    });
    console.log('✅ Added 404 route');

    console.log('🎉 All routes registered successfully!');
    console.log('📋 Available routes:', Array.from(router.routes.keys()));
    return router;
}
