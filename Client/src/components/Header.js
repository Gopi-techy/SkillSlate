import { createIcon } from '../utils/icons.js';
import { createLogo } from '../utils/logo.js';
import { apiService } from '../utils/api.js';

// Static flag to track if GitHub status has been checked globally
let githubStatusChecked = false;
let isCheckingGithub = false;

export class Header {
  constructor(user, onAuth, onNavigate) {
    console.log('🏗️ Header constructor called');
    this.user = user;
    this.onAuth = onAuth;
    this.onNavigate = onNavigate;
    this.isMenuOpen = false;
    
    // Only check GitHub status once per app session
    if (!githubStatusChecked && !isCheckingGithub && this.user) {
      console.log('🔍 Checking GitHub status...');
      this.checkGithubStatus();
    } else {
      console.log('⏭️ Skipping GitHub status check (already checked or in progress)');
    }
  }

  async checkGithubStatus() {
    // Prevent multiple concurrent calls
    if (isCheckingGithub || githubStatusChecked) {
      return;
    }
    
    if (this.user) {
      isCheckingGithub = true;
      try {
        const response = await apiService.getGithubStatus();
        // Only set githubData if we got a successful response
        if (response && response.data) {
          this.user.githubData = response.data;
          // Force re-render of the header
          this.updateGithubStatus(response.data);
        } else {
          // Clear GitHub data if not connected
          this.user.githubData = null;
          this.updateGithubStatus(null);
        }
        githubStatusChecked = true; // Mark as checked globally
      } catch (error) {
        console.warn('Failed to fetch GitHub status:', error);
        // Clear GitHub data on error
        this.user.githubData = null;
        this.updateGithubStatus(null);
        githubStatusChecked = true; // Mark as checked even on error
      } finally {
        isCheckingGithub = false;
      }
    }
  }

  // Method to reset GitHub status check (useful after OAuth callback)
  static resetGithubStatus() {
    githubStatusChecked = false;
    isCheckingGithub = false;
  }

  updateGithubStatus(githubData) {
    const userMenuButton = document.getElementById('user-menu-button');
    const githubStatusIndicator = document.getElementById('github-status-indicator');
    
    if (userMenuButton && !githubStatusIndicator) {
      const indicator = document.createElement('span');
      indicator.id = 'github-status-indicator';
      indicator.className = githubData ? 'text-green-500 ml-2' : 'text-gray-500 ml-2';
      indicator.innerHTML = createIcon('Github', 'w-4 h-4');
      userMenuButton.appendChild(indicator);
    }
  }

  render() {
    return `
      <header class="sticky top-0 backdrop-blur-xl border-b border-gray-700/50 rounded-b-2xl" style="background: rgba(17, 24, 39, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); z-index: 1000;">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="position: relative; z-index: 1001;">
          <div class="flex justify-between items-center h-16">
            <div class="cursor-pointer" data-nav="${this.user ? 'dashboard' : 'landing'}">
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
        class="text-gray-300 hover:text-white transition-colors font-medium focus:outline-none"
      >
        Dashboard
      </button>
      
      <button
        data-nav="create"
        class="text-gray-300 hover:text-white transition-colors font-medium focus:outline-none"
      >
        Create Portfolio
      </button>
      
      <div class="relative" style="z-index: 10000;">
        <button 
          id="user-menu-button"
          class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          ${createIcon('User', 'w-4 h-4')}
          <span>${this.user.name || this.user.email}</span>
          <span id="github-status-indicator" class="${this.user.githubData ? 'text-green-500' : 'text-gray-500'} ml-2">
            ${createIcon('Github', 'w-4 h-4')}
          </span>
          ${createIcon('ChevronDown', 'w-4 h-4')}
        </button>
        <div 
          id="user-menu-dropdown"
          class="dropdown-menu right-0 mt-2 w-48 glass-card opacity-0 invisible transition-all duration-200 border border-gray-600/50 shadow-xl"
        >
          <div class="py-1">
            <button 
              id="github-connect-btn"
              class="flex items-center space-x-2 w-full px-4 py-2 text-sm ${this.user.githubData ? 'text-green-500' : 'text-gray-300'} hover:text-white transition-colors focus:outline-none"
            >
              ${createIcon('Github', 'w-4 h-4')}
              <span>${this.user.githubData ? 'Connected' : 'Connect GitHub'}</span>
            </button>
            <button 
              id="settings-btn"
              class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors focus:outline-none"
            >
              ${createIcon('Settings', 'w-4 h-4')}
              <span>Settings</span>
            </button>
            <button
              id="sign-out"
              class="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors focus:outline-none"
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
        data-nav="create"
        class="text-left text-gray-300 hover:text-white transition-colors"
      >
        Create Portfolio
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
    // Remove any existing event listeners to prevent duplicates
    this.removeEventListeners();
    
    // User menu dropdown
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    console.log('User menu elements found:', {
      button: !!userMenuButton,
      dropdown: !!userMenuDropdown
    });
    
    if (userMenuButton && userMenuDropdown) {
      this.userMenuHandler = (e) => {
        e.stopPropagation();
        console.log('User menu clicked');
        const isVisible = userMenuDropdown.classList.contains('opacity-100');
        
        console.log('Dropdown currently visible:', isVisible);
        
        if (isVisible) {
          // Hide dropdown
          userMenuDropdown.classList.remove('opacity-100', 'visible');
          userMenuDropdown.classList.add('opacity-0', 'invisible');
          console.log('Hiding dropdown');
        } else {
          // Show dropdown
          userMenuDropdown.classList.remove('opacity-0', 'invisible');
          userMenuDropdown.classList.add('opacity-100', 'visible');
          console.log('Showing dropdown');
          
          // Position dropdown relative to button
          const buttonRect = userMenuButton.getBoundingClientRect();
          userMenuDropdown.style.position = 'fixed';
          userMenuDropdown.style.top = `${buttonRect.bottom + 8}px`;
          userMenuDropdown.style.right = `${window.innerWidth - buttonRect.right}px`;
          userMenuDropdown.style.left = 'auto';
        }
      };
      
      userMenuButton.addEventListener('click', this.userMenuHandler);
      
      // Close dropdown when clicking outside
      this.outsideClickHandler = (e) => {
        if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
          userMenuDropdown.classList.remove('opacity-100', 'visible');
          userMenuDropdown.classList.add('opacity-0', 'invisible');
        }
      };
      
      document.addEventListener('click', this.outsideClickHandler);
    }
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuToggle) {
      this.mobileMenuHandler = () => {
        this.isMenuOpen = !this.isMenuOpen;
        if (mobileMenu) {
          mobileMenu.classList.toggle('hidden');
        }
        // Update the icon without re-rendering the entire page
        const icon = mobileMenuToggle.querySelector('svg');
        if (icon) {
          mobileMenuToggle.innerHTML = this.isMenuOpen ? 
            createIcon('X', 'w-6 h-6') : 
            createIcon('Menu', 'w-6 h-6');
        }
      };
      mobileMenuToggle.addEventListener('click', this.mobileMenuHandler);
    }

    // Navigation buttons
    this.navHandlers = [];
    document.querySelectorAll('[data-nav]').forEach(button => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let page = button.getAttribute('data-nav');
        
        // If clicking the logo wrapper, decide based on current user state
        if (!page) {
          page = this.user ? 'dashboard' : 'landing';
        }
        
        console.log('Header navigation clicked:', page, 'User state:', this.user ? 'logged in' : 'not logged in');
        
        if (page && this.onNavigate) {
          this.onNavigate(page);
        }
      };
      
      button.addEventListener('click', handler);
      this.navHandlers.push({ element: button, handler });
    });

    // Sign out buttons
    const signOutBtn = document.getElementById('sign-out');
    const mobileSignOutBtn = document.getElementById('mobile-sign-out');
    const settingsBtn = document.getElementById('settings-btn');

    this.signOutHandler = async () => {
      try {
        console.log('Signing out user...');
        // Close dropdown first
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        if (userMenuDropdown) {
          userMenuDropdown.classList.remove('opacity-100', 'visible');
          userMenuDropdown.classList.add('opacity-0', 'invisible');
        }
        
        await apiService.logout();
        this.onAuth(null);
        this.onNavigate('landing');
      } catch (error) {
        console.error('Logout error:', error);
        // Still logout locally even if API call fails
        this.onAuth(null);
        this.onNavigate('landing');
      }
    };

    this.settingsHandler = () => {
      console.log('Settings clicked - feature coming soon');
      // Close dropdown first
      const userMenuDropdown = document.getElementById('user-menu-dropdown');
      if (userMenuDropdown) {
        userMenuDropdown.classList.remove('opacity-100', 'visible');
        userMenuDropdown.classList.add('opacity-0', 'invisible');
      }
      // For now, just show an alert - you can implement settings page later
      alert('Settings feature coming soon!');
    };

    if (signOutBtn) {
      signOutBtn.addEventListener('click', this.signOutHandler);
    }
    if (mobileSignOutBtn) {
      mobileSignOutBtn.addEventListener('click', this.signOutHandler);
    }
    if (settingsBtn) {
      settingsBtn.addEventListener('click', this.settingsHandler);
    }

    // GitHub connect button
    const githubConnectBtn = document.getElementById('github-connect-btn');
    this.githubConnectHandler = async () => {
      try {
        console.log('🔗 GitHub connect clicked from header');
        
        // Set action to 'connect' so it knows to link to existing account
        localStorage.setItem('github_action', 'connect');
        
        // Generate state for OAuth
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('github_state', state);
        
        // Get GitHub auth URL
        const response = await apiService.getGithubAuthUrl(state);
        
        if (response.url) {
          window.location.href = response.url;
        }
      } catch (error) {
        console.error('Failed to start GitHub connection:', error);
        alert('Failed to connect to GitHub. Please try again.');
      }
    };

    if (githubConnectBtn) {
      githubConnectBtn.addEventListener('click', this.githubConnectHandler);
    }
  }

  removeEventListeners() {
    // Remove navigation event listeners
    if (this.navHandlers) {
      this.navHandlers.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
      this.navHandlers = [];
    }

    // Remove user menu handlers
    const userMenuButton = document.getElementById('user-menu-button');
    if (userMenuButton && this.userMenuHandler) {
      userMenuButton.removeEventListener('click', this.userMenuHandler);
    }
    
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }

    // Remove mobile menu handler
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle && this.mobileMenuHandler) {
      mobileMenuToggle.removeEventListener('click', this.mobileMenuHandler);
    }

    // Remove sign out and settings handlers
    const signOutBtn = document.getElementById('sign-out');
    const mobileSignOutBtn = document.getElementById('mobile-sign-out');
    const settingsBtn = document.getElementById('settings-btn');
    const githubConnectBtn = document.getElementById('github-connect-btn');
    
    if (signOutBtn && this.signOutHandler) {
      signOutBtn.removeEventListener('click', this.signOutHandler);
    }
    if (mobileSignOutBtn && this.signOutHandler) {
      mobileSignOutBtn.removeEventListener('click', this.signOutHandler);
    }
    if (settingsBtn && this.settingsHandler) {
      settingsBtn.removeEventListener('click', this.settingsHandler);
    }
    if (githubConnectBtn && this.githubConnectHandler) {
      githubConnectBtn.removeEventListener('click', this.githubConnectHandler);
    }
  }
}
