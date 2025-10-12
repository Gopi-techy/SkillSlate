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
        
        // Try to restore user session first
        if (!app.user) {
            app.restoreUserSession();
        }
        
        if (app.user) {
            console.log('✅ User found, redirecting to dashboard');
            router.navigate('dashboard');
            return null;
        } else {
            console.log('❌ No user found, redirecting to landing');
            router.navigate('landing');
            return null;
        }
    });
    console.log('✅ Added root route');

    // Login Page
    router.addRoute('login', () => {
        console.log('🔐 Rendering login page');
        
        // Check if already authenticated
        if (!app.user) {
            app.restoreUserSession();
        }
        
        if (app.user) {
            console.log('✅ User already authenticated, redirecting to dashboard');
            router.navigate('dashboard');
            return null;
        }
        
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
        
        // Check if already authenticated
        if (!app.user) {
            app.restoreUserSession();
        }
        
        if (app.user) {
            console.log('✅ User already authenticated, redirecting to dashboard');
            router.navigate('dashboard');
            return null;
        }
        
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
        
        // First check if user is already loaded
        if (!app.user) {
            // Try to restore from localStorage
            if (!app.restoreUserSession()) {
                console.log('❌ No valid session, redirecting to login');
                router.navigate('login');
                return null;
            }
        }
        
        console.log('✅ User authenticated for dashboard:', app.user.email);
        
        const dashboard = new Dashboard(
            app.user,
            () => {
                app.handleAuth(null);
                router.navigate('landing');
            },
            (page) => router.navigate(page)
        );
        window.dashboardComponent = dashboard;
        const content = dashboard.render();
        console.log('Dashboard content length:', content ? content.length : 'null/undefined');
        return content;
    });
    console.log('✅ Added dashboard route');

    // Create Portfolio (Protected)
    router.addRoute('create', () => {
        console.log('🎨 Rendering create portfolio');
        
        // First check if user is already loaded
        if (!app.user) {
            // Try to restore from localStorage
            if (!app.restoreUserSession()) {
                console.log('❌ No valid session, redirecting to login');
                router.navigate('login');
                return null;
            }
        }
        
        console.log('✅ User authenticated for create portfolio:', app.user.email);
        
        const createPortfolio = new CreatePortfolio(
            app.user,
            (page) => router.navigate(page)
        );
        window.createPortfolioComponent = createPortfolio;
        const content = createPortfolio.render();
        console.log('CreatePortfolio content length:', content ? content.length : 'null/undefined');
        return content;
    });
    console.log('✅ Added create route');

    // Templates route removed

    // 404 Handler
    router.addRoute('404', () => {
        console.log('❌ Rendering 404 page');
        
        const notFoundPage = {
            render() {
                return `
                    <div class="min-h-screen flex items-center justify-center">
                        <div class="text-center">
                            <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
                            <h2 class="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                            <p class="text-gray-300 mb-8">The page you're looking for doesn't exist.</p>
                            <button
                                data-nav="${app.user ? 'dashboard' : 'landing'}"
                                class="btn-primary"
                            >
                                ${app.user ? 'Go to Dashboard' : 'Go Home'}
                            </button>
                        </div>
                    </div>
                `;
            },
            attachEventListeners() {
                document.querySelectorAll('[data-nav]').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const page = button.getAttribute('data-nav');
                        if (page) {
                            router.navigate(page);
                        }
                    });
                });
            }
        };
        
        window.notFoundPageComponent = notFoundPage;
        return notFoundPage.render();
    });
    console.log('✅ Added 404 route');

    console.log('🎉 All routes registered successfully!');
    console.log('📋 Available routes:', Array.from(router.routes.keys()));
    return router;
}
