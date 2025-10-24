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
        
        // Initial loading state
        const content = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center max-w-lg">
                    <h2 class="text-2xl font-semibold text-white mb-4">Completing GitHub Authentication</h2>
                    <p class="text-gray-300">Please wait while we securely link your GitHub account.</p>
                    <div class="mt-6 flex items-center justify-center space-x-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        <span class="text-cyan-400 font-medium">Linking GitHub Account...</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app').innerHTML = content;
        
        // Create a container for status updates
        const statusContainer = document.createElement('div');
        statusContainer.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300';
        document.body.appendChild(statusContainer);
        
        const updateStatus = (message, type = 'info') => {
            const bgColor = type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                         : type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300'
                         : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
            
            statusContainer.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${bgColor} border backdrop-blur-sm`;
            statusContainer.innerHTML = `
                <div class="flex items-center space-x-3 min-w-[300px] max-w-md">
                    <div class="flex-shrink-0">
                        <div class="animate-pulse w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-400' : 'bg-cyan-400'}"></div>
                    </div>
                    <p class="text-sm">${message}</p>
                </div>
            `;
        };

        try {
            const urlParams = new URLSearchParams(window.location.search);
            console.log('🔍 GitHub callback URL parameters:', Object.fromEntries(urlParams));
            
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const access_token = urlParams.get('access_token');
            const error = urlParams.get('error');
            const error_description = urlParams.get('error_description');
            const github_error = urlParams.get('github_error');
            const github_error_description = urlParams.get('github_error_description');
            
            // Handle GitHub errors
            if (github_error) {
                throw new Error(`GitHub Error: ${github_error_description || github_error}`);
            }
            
            // Handle our backend errors
            if (error) {
                throw new Error(`${error}: ${error_description || 'Authentication failed'}`);
            }
            
            // Validate we got either a code or token
            if (!code && !access_token) {
                throw new Error('No authorization code or access token received');
            }
            
            // Validate state when present (ONLY if we have code - which means coming directly from GitHub)
            // If we have access_token, we've been redirected by our backend which already validated state
            if (code && !access_token) {
                const storedState = localStorage.getItem('github_state');
                if (state && (!storedState || state !== storedState)) {
                    console.error('❌ State mismatch:', { received: state, stored: storedState });
                    throw new Error('Invalid state parameter - security verification failed');
                }
            }
            
            updateStatus('Processing GitHub response...');
            
            // Get the stored action
            const storedAction = localStorage.getItem('github_action');
            console.log('🔑 GitHub callback action:', storedAction);
            
            // Check the URL parameters for the access token from the backend redirect
            if (!access_token) {
                console.error('❌ Missing access_token in URL parameters');
                throw new Error('No access token received from the server. Please try again.');
            }
            
            // Validate state one more time when we have access_token (from backend redirect)
            if (access_token && state) {
                const storedState = localStorage.getItem('github_state');
                if (!storedState || state !== storedState) {
                    console.error('❌ State mismatch:', { received: state, stored: storedState });
                    throw new Error('Invalid state parameter - security verification failed');
                }
            }
            
            // Clear stored state data after validation
            localStorage.removeItem('github_state');
            localStorage.removeItem('github_action');
            
            console.log('✅ Received access token from server');
            updateStatus('Access token received successfully');
            
            updateStatus('Starting GitHub integration...');
            
            if (storedAction === 'connect') {
                // This was a connection request from an already logged-in user
                // The user already has an auth token, just need to link GitHub
                await app.apiService.linkGithub(access_token);
                updateStatus('Updating profile...', 'success');
                
                // Update user data
                const profileResponse = await app.apiService.getProfile();
                if (profileResponse.user) {
                    app.handleAuth(profileResponse.user);
                    updateStatus('GitHub account linked successfully!', 'success');
                    setTimeout(() => router.navigate('dashboard'), 1000);
                } else {
                    throw new Error('Could not update user profile');
                }
            } else {
                updateStatus('Creating new account with GitHub...');
                // This was a login/signup with GitHub
                // First, register/login with GitHub to get our API token
                console.log('🔄 Sending GitHub login request...');
                const response = await app.apiService.login({ 
                    provider: 'github',
                    access_token: access_token
                });
                
                console.log('📦 GitHub login response:', response);
                
                if (!response || !response.user?.token) {
                    console.error('❌ Invalid login response:', response);
                    throw new Error('Failed to authenticate with GitHub token');
                }
                
                // Extract token from the nested response
                const apiToken = response.user.token;
                
                // Set our API token first
                auth.setSession(response.user, apiToken);
                app.apiService.setToken(apiToken);
                
                // Now we can link the GitHub account
                await app.apiService.linkGithub(access_token);
                
                updateStatus('Getting user profile...', 'success');
                // Get the latest profile data
                const profileResponse = await app.apiService.getProfile();
                if (profileResponse.user) {
                    app.handleAuth(profileResponse.user);
                    updateStatus('Successfully logged in with GitHub!', 'success');
                    setTimeout(() => router.navigate('dashboard'), 1000);
                } else {
                    throw new Error('Failed to get user profile');
                }
            }
        } catch (error) {
            console.error('❌ GitHub callback error:', error);
            
            // Clear any stored GitHub action
            localStorage.removeItem('github_action');
            
            // Create an error container with more detailed information
            const container = document.createElement('div');
            container.className = 'fixed top-4 right-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 max-w-md shadow-lg z-50';
            
            let errorMessage = 'Could not complete GitHub authentication.';
            if (error.message.includes('state parameter')) {
                errorMessage = 'Security verification failed. Please try the GitHub login again.';
            } else if (error.message.includes('access token')) {
                errorMessage = 'Did not receive proper authentication from GitHub. Please try again.';
            } else if (error.message.includes('profile')) {
                errorMessage = 'Could not retrieve your GitHub profile. Please ensure you grant the required permissions.';
            } else if (error.message.includes('GitHub Error:')) {
                errorMessage = error.message; // Use the GitHub error directly
            } else if (error.message.includes('token_exchange')) {
                errorMessage = 'Failed to exchange GitHub token. Please try again or contact support if the problem persists.';
            }
            
            container.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-medium">GitHub Authentication Failed</h3>
                        <p class="mt-1 text-xs">${errorMessage}</p>
                        <p class="mt-2 text-xs opacity-75">Error details: ${error.message}</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(container);
            
            // Remove the error message after 5 seconds
            setTimeout(() => {
                if (container.parentNode) {
                    container.remove();
                }
            }, 5000);
            
            router.navigate('login');
        }
        
        return null;
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
