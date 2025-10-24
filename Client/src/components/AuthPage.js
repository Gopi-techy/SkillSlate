import { createIcon } from '../utils/icons.js';
import { createLogo } from '../utils/logo.js';
import { apiService } from '../utils/api.js';

export class AuthPage {
  constructor(mode, onAuth, onNavigate) {
    this.mode = mode; // 'login' or 'signup'
    this.onAuth = onAuth;
    this.onNavigate = onNavigate;
    this.email = '';
    this.password = '';
    this.name = '';
  }

  render() {
    return `
      <div class="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
        <!-- First-Class Animated Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
          <!-- Animated gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 animate-pulse-slow"></div>
          
          
          <!-- Animated mesh grid -->
          <div class="absolute inset-0 opacity-[0.08]">
            <div class="grid grid-cols-12 gap-4 h-full">
              ${Array.from({length: 12}, (_, i) => 
                Array.from({length: 8}, (_, j) => 
                  `<div class="border border-gray-400/60 rounded-sm animate-pulse shimmer-effect" style="animation-delay: ${(i + j) * 0.1}s; animation-duration: 3s;"></div>`
                ).join('')
              ).join('')}
            </div>
          </div>
          
          
          
          <!-- Animated connecting lines -->
          <div class="absolute top-1/3 left-1/2 w-px h-20 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-pulse" style="animation-delay: 1.2s;"></div>
          <div class="absolute bottom-1/3 right-1/2 w-20 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse" style="animation-delay: 3.2s;"></div>
          <div class="absolute top-1/2 right-1/3 w-px h-16 bg-gradient-to-b from-transparent via-blue-500/25 to-transparent animate-pulse" style="animation-delay: 2.1s;"></div>
          
          
          <!-- Shimmer effects -->
          <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-effect opacity-30"></div>
        </div>
        
        <!-- Login Form -->
        <div class="relative z-10 glass-card p-8 w-full max-w-lg">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold gradient-text mb-3">
              ${this.mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p class="text-gray-300 text-sm">
              ${this.mode === 'login' 
                ? 'Sign in to your SkillSlate account' 
                : 'Start building your perfect portfolio'
              }
            </p>
          </div>

          <form id="auth-form" class="space-y-6">
            ${this.mode === 'signup' ? this.renderNameField() : ''}
            ${this.renderEmailField()}
            ${this.renderPasswordField()}

            <button
              type="submit"
              class="w-full btn-primary py-4 rounded-xl transition-colors duration-200"
            >
              <span class="flex items-center justify-center space-x-2">
                <span>${this.mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                ${createIcon('ArrowRight', 'w-4 h-4')}
              </span>
            </button>
          </form>

          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-gray-900/50 backdrop-blur-sm text-gray-400 rounded-full">or</span>
            </div>
          </div>

          <button
            id="github-auth"
            class="w-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 text-white py-4 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center space-x-3 backdrop-blur-sm"
          >
            ${createIcon('Github', 'w-5 h-5')}
            <span>Continue with GitHub</span>
          </button>

          <p class="text-center text-sm text-gray-400 mt-4">
            ${this.mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              data-nav="${this.mode === 'login' ? 'signup' : 'login'}"
              class="text-cyan-400 hover:text-cyan-300 font-semibold ml-1 transition-colors"
            >
              ${this.mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    `;
  }

  renderNameField() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 backdrop-blur-sm"
          placeholder="Enter your full name"
          required
        />
      </div>
    `;
  }

  renderEmailField() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 backdrop-blur-sm"
          placeholder="Enter your email"
          required
        />
      </div>
    `;
  }

  renderPasswordField() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <div class="relative">
          <input
            type="password"
            id="password"
            class="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 backdrop-blur-sm"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            id="toggle-password"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
          >
            <svg id="eye-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <svg id="eye-off-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
            </svg>
          </button>
        </div>
        ${this.mode === 'login' ? `
          <div class="text-right mt-2">
            <button
              type="button"
              id="forgot-password"
              class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Forgot Password?
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  attachEventListeners() {
    const form = document.getElementById('auth-form');
    const githubAuthBtn = document.getElementById('github-auth');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const forgotPasswordBtn = document.getElementById('forgot-password');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    if (githubAuthBtn) {
      githubAuthBtn.addEventListener('click', () => {
        this.handleGitHubAuth();
      });
    }

    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        this.togglePasswordVisibility();
      });
    }

    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', () => {
        this.handleForgotPassword();
      });
    }

    // Navigation buttons
    document.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const page = button.getAttribute('data-nav');
        if (page) {
          this.onNavigate(page);
        }
      });
    });
  }

  async handleSubmit() {
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const name = document.getElementById('name')?.value || '';

    // Show loading state
    this.showLoading(true);

    try {
      let response;
      
      if (this.mode === 'signup') {
        // Register new user
        response = await apiService.register({
          name,
          email,
          password
        });
      } else {
        // Login existing user
        response = await apiService.login({
          email,
          password
        });
      }

      // Set token and user data
      if (response.user && response.user.token) {
        apiService.setToken(response.user.token);
        console.log('✅ Authentication successful:', response.user.email);
        this.onAuth(response.user);
        // Navigation is handled in the routes
      } else if (response.token && response.user) {
        // Handle case where token and user are separate properties
        const userWithToken = { ...response.user, token: response.token };
        apiService.setToken(response.token);
        console.log('✅ Authentication successful:', response.user.email);
        this.onAuth(userWithToken);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (error) {
      this.showError(error.message || 'Authentication failed');
    } finally {
      this.showLoading(false);
    }
  }

  async handleGitHubAuth() {
    try {
      // Generate a random state value for security
      const state = Math.random().toString(36).substring(2, 15);
      const action = this.mode === 'login' ? 'github_login' : 'github_signup';
      
      // Store the state and action
      localStorage.setItem('github_state', state);
      localStorage.setItem('github_action', action);
      
      // Get GitHub OAuth URL from backend
      const response = await apiService.getGithubAuthUrl(state);
      
      if (!response || !response.url) {
        throw new Error('Invalid response from server: No authorization URL');
      }

      console.log('🔄 Initiating GitHub auth, state:', state);
      
      // Redirect to GitHub
      window.location.href = response.url;
    } catch (error) {
      console.error('❌ GitHub auth error:', error);
      this.showError(error.message || 'Failed to initiate GitHub authentication');
    }
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');

    if (passwordInput && eyeIcon && eyeOffIcon) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
      } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
      }
    }
  }

  handleForgotPassword() {
    // Mock forgot password functionality
    alert('Password reset instructions have been sent to your email address.');
    // In a real app, this would:
    // 1. Send a password reset email
    // 2. Navigate to a password reset page
    // 3. Or show a modal with reset options
  }

  showLoading(show) {
    const submitBtn = document.querySelector('#auth-form button[type="submit"]');
    if (submitBtn) {
      if (show) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="flex items-center justify-center space-x-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>${this.mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
          </span>
        `;
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span class="flex items-center justify-center space-x-2">
            <span>${this.mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            ${createIcon('ArrowRight', 'w-4 h-4')}
          </span>
        `;
      }
    }
  }

  showError(message) {
    // Remove existing error message
    const existingError = document.getElementById('auth-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.id = 'auth-error';
    errorDiv.className = 'mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm';
    errorDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;

    // Insert error message before the form
    const form = document.getElementById('auth-form');
    if (form) {
      form.parentNode.insertBefore(errorDiv, form);
      
      // Auto-remove error after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }
  }
}
