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
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const access_token = urlParams.get('access_token');
            const error = urlParams.get('error');
            const error_description = urlParams.get('error_description');
            
            if (error) {
                throw new Error(`${error}: ${error_description || 'Authentication failed'}`);
            }
            
            if (!code && !access_token) {
                throw new Error('No authorization code or access token received');
            }
            
            // Validate state if we have it stored
            const storedState = localStorage.getItem('github_state');
            if (storedState && state && state !== storedState) {
                throw new Error('Invalid state parameter - security verification failed');
            }
            
            updateStatus('Linking your GitHub account...');
            
            // Get the stored action
            const storedAction = localStorage.getItem('github_action');
            console.log('🔑 GitHub callback action:', storedAction);
            
            // Clear stored state data
            localStorage.removeItem('github_state');
            localStorage.removeItem('github_action');
            
            if (!access_token) {
                throw new Error('No access token received');
            }
            
            updateStatus('Verifying GitHub connection...');
            
            if (storedAction === 'connect') {
                // This was a connection request from an already logged-in user
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
                updateStatus('Linking GitHub account...');
                // This was a login/signup with GitHub
                await app.apiService.linkGithub(access_token);
                
                updateStatus('Getting user profile...', 'success');
                // Then get the user profile
                const profileResponse = await app.apiService.getProfile();
                if (profileResponse.user) {
                    app.handleAuth(profileResponse.user);
                    updateStatus('Successfully logged in with GitHub!', 'success');
                    setTimeout(() => router.navigate('dashboard'), 1000);
                } else {
                    throw new Error('Failed to get user profile');
                }
            }
            
            return content;
            
        } catch (error) {
            console.error('❌ GitHub callback error:', error);
            
            updateStatus(error.message || 'Authentication failed', 'error');
            
            setTimeout(() => {
                router.navigate('login');
                if (statusContainer.parentNode) {
                    statusContainer.remove();
                }
            }, 3000);
            
            return content;
        }
    });