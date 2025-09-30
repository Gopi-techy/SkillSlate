import { createIcon } from '../utils/icons.js';
import { createLogo } from '../utils/logo.js';
import { apiService } from '../utils/api.js';

export class Header {
  constructor(user, onAuth, onNavigate) {
    this.user = user;
    this.onAuth = onAuth;
    this.onNavigate = onNavigate;
    this.isMenuOpen = false;
  }

  render() {
    return `
      <header class="sticky top-0 z-50 backdrop-blur-xl border-b border-gray-700/50 rounded-b-2xl overflow-hidden" style="background: rgba(17, 24, 39, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="cursor-pointer" data-nav="${(localStorage.getItem('authToken') && localStorage.getItem('currentUser')) ? 'dashboard' : 'landing'}">
              ${createLogo()}
            </div>

            <div class="hidden md:flex items-center space-x-6">
              ${this.user ? this.renderUserMenu() : this.renderGuestMenu()}
            </div>

            <button
              id="mobile-menu-toggle"
              class="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              ${this.isMenuOpen ? createIcon('X', 'w-6 h-6') : createIcon('Menu', 'w-6 h-6')}
            </button>
          </div>

          <div id="mobile-menu" class="md:hidden border-t border-gray-700/50 py-4 hidden">
            <div class="flex flex-col space-y-4">
              ${this.user ? this.renderMobileUserMenu() : this.renderMobileGuestMenu()}
            </div>
          </div>
        </div>
      </header>
    `;
  }

  renderUserMenu() {
    return `
      <button
        data-nav="dashboard"
        class="text-gray-300 hover:text-white transition-colors font-medium"
      >
        Dashboard
      </button>
      
      <div class="relative group">
        <button class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
          ${createIcon('User', 'w-4 h-4')}
          <span>${this.user.email}</span>
        </button>
        <div class="absolute right-0 mt-2 w-48 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div class="py-1">
            <button class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors">
              ${createIcon('Settings', 'w-4 h-4')}
              <span>Settings</span>
            </button>
            <button
              id="sign-out"
              class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
            >
              ${createIcon('LogOut', 'w-4 h-4')}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderGuestMenu() {
    return `
      <div class="flex items-center space-x-4">
        <button
          data-nav="login"
          class="text-gray-300 hover:text-white transition-colors font-medium"
        >
          Sign In
        </button>
        <button
          data-nav="signup"
          class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 text-sm"
        >
          Get Started
        </button>
      </div>
    `;
  }

  renderMobileUserMenu() {
    return `
      <button
        data-nav="dashboard"
        class="text-left text-gray-300 hover:text-white transition-colors"
      >
        Dashboard
      </button>
      <button
        data-nav="templates"
        class="text-left text-gray-300 hover:text-white transition-colors"
      >
        Templates
      </button>
      <button
        id="mobile-sign-out"
        class="text-left text-gray-300 hover:text-white transition-colors"
      >
        Sign Out
      </button>
    `;
  }

  renderMobileGuestMenu() {
    return `
      <button
        data-nav="login"
        class="text-left text-gray-300 hover:text-white transition-colors"
      >
        Sign In
      </button>
      <button
        data-nav="signup"
        class="text-left btn-primary"
      >
        Get Started
      </button>
    `;
  }

  attachEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        this.isMenuOpen = !this.isMenuOpen;
        mobileMenu.classList.toggle('hidden');
        // Re-render to update icon
        this.onNavigate(this.onNavigate.currentPage || 'landing');
      });
    }

        // Navigation buttons
        document.querySelectorAll('[data-nav]').forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            let page = button.getAttribute('data-nav');
            // If clicking the logo wrapper, decide based on storage each time
            if (!page) {
              page = (localStorage.getItem('authToken') && localStorage.getItem('currentUser')) ? 'dashboard' : 'landing';
            }
            console.log('Navigation clicked:', page, 'Header User state:', this.user ? 'logged in' : 'not logged in');
            if (page) {
              this.onNavigate(page);
            }
          });
        });

    // Sign out buttons
    const signOutBtn = document.getElementById('sign-out');
    const mobileSignOutBtn = document.getElementById('mobile-sign-out');

    [signOutBtn, mobileSignOutBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', async () => {
          try {
            await apiService.logout();
            this.onAuth(null);
            this.onNavigate('landing');
          } catch (error) {
            console.error('Logout error:', error);
            // Still logout locally even if API call fails
            this.onAuth(null);
            this.onNavigate('landing');
          }
        });
      }
    });
  }
}
