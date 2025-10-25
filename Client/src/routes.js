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

    // GitHub OAuth Callback
    router.addRoute('github-callback', async () => {
        console.log('🔄 Processing GitHub callback');
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const access_token = urlParams.get('access_token');
        const storedState = localStorage.getItem('github_state');
        const storedAction = localStorage.getItem('github_action');
        
        // Check if this is a page reload AFTER successful auth
        // Only skip if we have no stored action (meaning auth was already completed)
        if (!storedState && !storedAction && access_token) {
            console.log('⏭️ Detected page reload after completed auth, redirecting to dashboard');
            // Clean URL and redirect to dashboard
            window.history.replaceState({}, document.title, '/dashboard');
            router.navigate('dashboard');
            return `<div class="min-h-screen flex items-center justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>`;
        }
        
        // Initial loading state with GitHub icon
        const content = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center max-w-lg">
                    <div class="mb-8">
                        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/30 mb-6">
                            <svg class="w-10 h-10 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </div>
                    </div>
                    <h2 class="text-2xl font-semibold text-white mb-2">Completing GitHub Authentication</h2>
                    <p class="text-gray-400 text-sm mb-8">Securely linking your account...</p>
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app').innerHTML = content;

        try {
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            const error_description = urlParams.get('error_description');
            const github_error = urlParams.get('github_error');
            const github_error_description = urlParams.get('github_error_description');
            
            // Handle errors
            if (github_error) throw new Error(`GitHub Error: ${github_error_description || github_error}`);
            if (error) throw new Error(`${error}: ${error_description || 'Authentication failed'}`);
            if (!code && !access_token) throw new Error('No authorization code or access token received');
            if (!access_token) throw new Error('No access token received from the server');
            
            // Validate state parameter if both exist
            if (state && storedState && state !== storedState) {
                console.error('❌ State mismatch:', { received: state, stored: storedState });
                throw new Error('Security verification failed. Please try again.');
            }
            
            // Clear stored data after validation
            localStorage.removeItem('github_state');
            localStorage.removeItem('github_action');
            
            console.log('✅ GitHub token received, processing authentication...');
            console.log('🔑 Action type:', storedAction || 'new login');
            
            if (storedAction === 'connect') {
                console.log('🔗 Linking GitHub to existing logged-in user...');
                // Connection from logged-in user
                await app.apiService.linkGithub(access_token);
                console.log('✅ GitHub linked successfully');
                
                const profileResponse = await app.apiService.getProfile();
                if (!profileResponse.user) throw new Error('Could not update user profile');
                
                app.handleAuth(profileResponse.user);
                window.history.replaceState({}, document.title, '/dashboard');
                setTimeout(() => router.navigate('dashboard'), 500);
            } else {
                console.log('🆕 New GitHub login/signup...');
                // New login/signup
                const response = await app.apiService.login({ provider: 'github', access_token });
                if (!response?.user?.token) throw new Error('Failed to authenticate with GitHub');
                
                const apiToken = response.user.token;
                auth.setSession(response.user, apiToken);
                app.apiService.setToken(apiToken);
                
                await app.apiService.linkGithub(access_token);
                
                const profileResponse = await app.apiService.getProfile();
                if (!profileResponse.user) throw new Error('Failed to get user profile');
                
                app.handleAuth(profileResponse.user);
                window.history.replaceState({}, document.title, '/dashboard');
                setTimeout(() => router.navigate('dashboard'), 500);
            }
            
            return content;
            
        } catch (error) {
            console.error('❌ GitHub callback error:', error);
            
            // Clear stored data
            localStorage.removeItem('github_action');
            localStorage.removeItem('github_state');
            
            // Show professional error page
            document.getElementById('app').innerHTML = `
                <div class="min-h-screen flex items-center justify-center px-4">
                    <div class="text-center max-w-md">
                        <div class="mb-6">
                            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/30">
                                <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h2 class="text-2xl font-semibold text-white mb-3">Authentication Failed</h2>
                        <p class="text-gray-400 mb-8">${error.message || 'An unexpected error occurred during GitHub authentication.'}</p>
                        <button 
                            onclick="window.router.navigate('login')"
                            class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-cyan-500/50"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            `;
            
            return content;
        }
    });
    console.log('✅ Added github-callback route');

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
