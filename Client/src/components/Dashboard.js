import { createIcon } from '../utils/icons.js';

export class Dashboard {
  constructor(user, onAuth, onNavigate) {
    this.user = user;
    this.onAuth = onAuth;
    this.onNavigate = onNavigate;
    this.portfolios = [
      {
        id: '1',
        name: 'My Portfolio',
        template: 'modern',
        status: 'deployed',
        url: 'https://johndoe.skillslate.app',
        lastDeployed: '2024-01-15'
      }
    ];
  }

  render() {
    console.log('Dashboard render called for user:', this.user?.email);
    
    try {
      const content = `
        <div class="min-h-screen py-8">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8 animate-fade-in-up">
              <h1 class="text-4xl font-bold text-white mb-2">
                Welcome back, <span class="gradient-text">${this.user?.name || this.user?.email?.split('@')[0] || 'User'}</span>!
              </h1>
              <p class="text-gray-300 text-lg">Manage your portfolios and create something amazing.</p>
            </div>

            <div class="grid lg:grid-cols-4 gap-8">
              <!-- Main Content -->
              <div class="lg:col-span-3 space-y-6">
                ${this.renderQuickActions()}
                ${this.renderPortfolios()}
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                ${this.renderGitHubIntegration()}
                ${this.renderUsageStats()}
              </div>
            </div>
          </div>
        </div>
      `;
      
      console.log('Dashboard content generated, length:', content.length);
      return content;
    } catch (error) {
      console.error('Dashboard render error:', error);
      return `
        <div class="min-h-screen py-8">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-bold text-white mb-2">Dashboard Error</h1>
            <p class="text-red-400">Error rendering dashboard: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  renderQuickActions() {
    return `
      <div class="glass-card p-8 animate-slide-in-left">
        <h2 class="text-2xl font-semibold text-white mb-6">Quick Start</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <button
            data-nav="create"
            class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-8 rounded-2xl transition-all transform hover:scale-105 flex items-center space-x-4 card-hover"
          >
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              ${createIcon('Plus', 'w-6 h-6')}
            </div>
            <div class="text-left">
              <div class="font-semibold text-lg">Create New Portfolio</div>
              <div class="text-sm text-cyan-100">From prompt or resume</div>
            </div>
          </button>
          <button
            data-nav="create"
            class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white p-8 rounded-2xl transition-all transform hover:scale-105 flex items-center space-x-4 card-hover"
          >
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              ${createIcon('Palette', 'w-6 h-6')}
            </div>
            <div class="text-left">
              <div class="font-semibold text-lg">Create from Template</div>
              <div class="text-sm text-purple-100">Modern, Creative, Minimal</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  renderPortfolios() {
    return `
      <div class="glass-card animate-slide-in-right">
        <div class="p-6 border-b border-gray-700/50">
          <h2 class="text-2xl font-semibold text-white">Your Portfolios</h2>
        </div>
        <div class="p-6">
          ${this.portfolios.length > 0 ? this.renderPortfolioList() : this.renderEmptyState()}
        </div>
      </div>
    `;
  }

  renderPortfolioList() {
    return `
      <div class="space-y-4">
        ${this.portfolios.map(portfolio => `
          <div class="border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 bg-gray-800/30 backdrop-blur-sm">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-white text-lg">${portfolio.name}</h3>
                <p class="text-sm text-gray-400 capitalize">${portfolio.template} template</p>
                <div class="flex items-center space-x-4 mt-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    portfolio.status === 'deployed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : portfolio.status === 'building'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }">
                    ${portfolio.status === 'deployed' ? createIcon('Check', 'w-3 h-3 mr-1') : ''}
                    ${portfolio.status.charAt(0).toUpperCase() + portfolio.status.slice(1)}
                  </span>
                  ${portfolio.url ? `
                    <a
                      href="${portfolio.url}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-cyan-400 hover:text-cyan-300 text-sm flex items-center space-x-1 transition-colors"
                    >
                      <span>View Live</span>
                      ${createIcon('ExternalLink', 'w-3 h-3')}
                    </a>
                  ` : ''}
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button class="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200">
                  ${createIcon('Settings', 'w-5 h-5')}
                </button>
                <button class="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200">
                  ${createIcon('Eye', 'w-5 h-5')}
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          ${createIcon('FileText', 'w-8 h-8 text-gray-400')}
        </div>
        <h3 class="text-xl font-medium text-white mb-3">No portfolios yet</h3>
        <p class="text-gray-400 mb-6">Create your first portfolio to get started</p>
        <button
          data-nav="create"
          class="btn-primary"
        >
          Create Portfolio
        </button>
      </div>
    `;
  }

  renderGitHubIntegration() {
    const githubData = this.user.githubData;
    const isConnected = githubData || this.user.githubConnected;
    
    return `
      <div class="glass-card p-6 animate-fade-in-up">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-white text-lg">GitHub</h3>
          ${createIcon('Github', 'w-5 h-5 text-gray-400')}
        </div>
        
        ${isConnected ? `
          <!-- Connected State -->
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div class="flex items-center space-x-2">
                ${createIcon('Check', 'w-4 h-4 text-green-500')}
                <span class="text-sm font-medium text-green-500">Connected</span>
              </div>
              ${githubData?.login ? `
                <span class="text-xs text-gray-400">@${githubData.login}</span>
              ` : ''}
            </div>
            ${githubData?.public_repos !== undefined ? `
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div class="text-base font-semibold text-white">${githubData.public_repos}</div>
                  <div class="text-xs text-gray-400">Repositories</div>
                </div>
                <div class="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div class="text-base font-semibold text-white">${githubData.followers || 0}</div>
                  <div class="text-xs text-gray-400">Followers</div>
                </div>
              </div>
            ` : ''}
            <p class="text-xs text-gray-400 mt-2">
              Deploy to GitHub Pages and sync projects.
            </p>
          </div>
        ` : `
          <!-- Not Connected State -->
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div class="flex items-center space-x-2">
                ${createIcon('X', 'w-4 h-4 text-gray-500')}
                <span class="text-sm font-medium text-gray-400">Not Connected</span>
              </div>
            </div>
            <button 
              id="dashboard-github-connect"
              class="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-600 hover:border-gray-500 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              ${createIcon('Github', 'w-4 h-4')}
              <span class="font-medium">Connect GitHub</span>
            </button>
            <p class="text-xs text-gray-400 mt-2">
              Link account to deploy and sync projects.
            </p>
          </div>
        `}
      </div>
    `;
  }

  renderUsageStats() {
    return `
      <div class="glass-card p-6 animate-fade-in-up" style="animation-delay: 0.2s;">
        <h3 class="font-semibold text-white mb-6 text-lg">Usage This Month</h3>
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-300">Portfolios</span>
            <span class="text-sm font-medium text-white">${this.portfolios.length}/3</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-300">Deployments</span>
            <span class="text-sm font-medium text-white">5/10</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000" style="width: 60%"></div>
          </div>
          <div class="text-xs text-gray-400 text-center">
            Upgrade for unlimited portfolios
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const page = button.getAttribute('data-nav');
        console.log('Dashboard navigation clicked:', page);
        if (page && this.onNavigate) {
          this.onNavigate(page);
        }
      });
    });
    
    // Dashboard GitHub connect button
    const dashboardGithubConnect = document.getElementById('dashboard-github-connect');
    if (dashboardGithubConnect) {
      dashboardGithubConnect.addEventListener('click', async () => {
        console.log('🔗 GitHub connect clicked from dashboard');
        try {
          const { apiService } = await import('../utils/api.js');
          
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
      });
    }
  }
}
