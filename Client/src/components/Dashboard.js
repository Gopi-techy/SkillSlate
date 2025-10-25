import { createIcon } from '../utils/icons.js';
import { apiService } from '../utils/api.js';

export class Dashboard {
  constructor(user, onAuth, onNavigate) {
    this.user = user;
    this.onAuth = onAuth;
    this.onNavigate = onNavigate;
    this.portfolios = [];
    this.portfolioStats = null;
    this.loading = true;
  }

  async loadPortfolios() {
    try {
      const response = await apiService.getPortfolios();
      console.log('Portfolio API response:', response);
      if (response.success) {
        this.portfolios = response.portfolios || [];
        console.log('Loaded portfolios:', this.portfolios);
      } else {
        console.error('Failed to load portfolios:', response.message);
        this.portfolios = [];
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      this.portfolios = [];
    } finally {
      this.loading = false;
    }
  }

  forceRerender() {
    // Trigger a re-render by calling the app's render method
    if (window.app && window.app.render) {
      window.app.render();
    }
  }

  async loadPortfolioStats() {
    try {
      const response = await apiService.getPortfolioStats();
      if (response.success) {
        this.portfolioStats = response.stats;
      }
    } catch (error) {
      console.error('Error loading portfolio stats:', error);
    }
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
    const portfolioCount = this.portfolios.length;
    const maxPortfolios = 2; // GitHub Pages limit
    const isAtLimit = portfolioCount >= maxPortfolios;
    
    return `
      <div class="glass-card p-8 animate-slide-in-left">
        <h2 class="text-2xl font-semibold text-white mb-6">Quick Start</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <button
            ${isAtLimit ? 'disabled' : 'data-nav="create"'}
            class="${isAtLimit ? 
              'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed p-8 rounded-2xl flex items-center space-x-4' : 
              'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-8 rounded-2xl transition-all transform hover:scale-105 flex items-center space-x-4 card-hover'
            }"
          >
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              ${isAtLimit ? createIcon('X', 'w-6 h-6') : createIcon('Plus', 'w-6 h-6')}
            </div>
            <div class="text-left">
              <div class="font-semibold text-lg">${isAtLimit ? 'Portfolio Limit Reached' : 'Create New Portfolio'}</div>
              <div class="text-sm ${isAtLimit ? 'text-gray-500' : 'text-cyan-100'}">
                ${isAtLimit ? 'Delete a portfolio to create new one' : 'From prompt or resume'}
              </div>
            </div>
          </button>
          <button
            ${isAtLimit ? 'disabled' : 'data-nav="create"'}
            class="${isAtLimit ? 
              'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed p-8 rounded-2xl flex items-center space-x-4' : 
              'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white p-8 rounded-2xl transition-all transform hover:scale-105 flex items-center space-x-4 card-hover'
            }"
          >
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              ${isAtLimit ? createIcon('X', 'w-6 h-6') : createIcon('Palette', 'w-6 h-6')}
            </div>
            <div class="text-left">
              <div class="font-semibold text-lg">${isAtLimit ? 'Portfolio Limit Reached' : 'Create from Template'}</div>
              <div class="text-sm ${isAtLimit ? 'text-gray-500' : 'text-purple-100'}">
                ${isAtLimit ? 'Delete a portfolio to create new one' : 'Modern, Creative, Minimal'}
              </div>
            </div>
          </button>
        </div>
        ${isAtLimit ? `
          <div class="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div class="flex items-center space-x-2">
              ${createIcon('AlertTriangle', 'w-5 h-5 text-red-400')}
              <span class="text-sm text-red-400 font-medium">GitHub Pages Limit Reached</span>
            </div>
            <p class="text-xs text-red-300 mt-1">
              You've reached the maximum of 2 portfolios allowed with GitHub Pages. Delete an existing portfolio to create a new one.
            </p>
          </div>
        ` : ''}
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
          ${this.loading ? this.renderLoadingState() : 
            this.portfolios.length > 0 ? this.renderPortfolioList() : this.renderEmptyState()}
        </div>
      </div>
    `;
  }

  renderLoadingState() {
    return `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span class="ml-3 text-gray-400">Loading portfolios...</span>
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
                      : portfolio.status === 'failed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }">
                    ${portfolio.status === 'deployed' ? createIcon('Check', 'w-3 h-3 mr-1') : ''}
                    ${portfolio.status === 'building' ? createIcon('Rocket', 'w-3 h-3 mr-1') : ''}
                    ${portfolio.status === 'failed' ? createIcon('X', 'w-3 h-3 mr-1') : ''}
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
                  ${portfolio.status === 'draft' ? `
                    <button 
                      class="text-cyan-400 hover:text-cyan-300 text-sm flex items-center space-x-1 transition-colors"
                      onclick="window.dashboardComponent.deployPortfolio('${portfolio.id}')"
                    >
                      <span>Deploy</span>
                      ${createIcon('Rocket', 'w-3 h-3')}
                    </button>
                  ` : ''}
                </div>
                ${portfolio.lastDeployed ? `
                  <p class="text-xs text-gray-500 mt-2">
                    Last deployed: ${new Date(portfolio.lastDeployed).toLocaleDateString()}
                  </p>
                ` : ''}
              </div>
              <div class="flex items-center space-x-2">
                <button 
                  class="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                  onclick="window.dashboardComponent.editPortfolio('${portfolio.id}')"
                >
                  ${createIcon('Settings', 'w-5 h-5')}
                </button>
                <button 
                  class="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200"
                  onclick="window.dashboardComponent.viewPortfolio('${portfolio.id}')"
                >
                  ${createIcon('Eye', 'w-5 h-5')}
                </button>
                <button 
                  class="p-3 text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/10 transition-all duration-200"
                  onclick="window.dashboardComponent.deletePortfolio('${portfolio.id}')"
                >
                  ${createIcon('X', 'w-5 h-5')}
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
      <div class="text-center py-3">
        <div class="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2">
          ${createIcon('FileText', 'w-4 h-4 text-gray-400')}
        </div>
        <h3 class="text-base font-medium text-white mb-1">No portfolios yet</h3>
        <p class="text-gray-400 mb-3 text-xs">Create your first portfolio to get started</p>
        <button
          data-nav="create"
          class="btn-primary text-xs px-3 py-1.5"
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
    const portfolioCount = this.portfolios.length;
    const maxPortfolios = 2; // GitHub Pages limit
    const deployedCount = this.portfolios.filter(p => p.status === 'deployed').length;
    const maxDeployments = maxPortfolios; // Same as portfolio limit for GitHub Pages
    
    const portfolioPercentage = (portfolioCount / maxPortfolios) * 100;
    const deploymentPercentage = (deployedCount / maxDeployments) * 100;
    
    const isAtLimit = portfolioCount >= maxPortfolios;
    const isNearLimit = portfolioCount >= maxPortfolios * 0.8;
    
    return `
      <div class="glass-card p-6 animate-fade-in-up" style="animation-delay: 0.2s;">
        <h3 class="font-semibold text-white mb-6 text-lg">Usage This Month</h3>
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-300">Portfolios</span>
            <span class="text-sm font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'}">
              ${portfolioCount}/${maxPortfolios}
              ${isAtLimit ? ' (Limit Reached)' : ''}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-300">Deployments</span>
            <span class="text-sm font-medium text-white">${deployedCount}/${maxDeployments}</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3">
            <div class="bg-gradient-to-r ${isAtLimit ? 'from-red-500 to-red-600' : isNearLimit ? 'from-yellow-500 to-yellow-600' : 'from-cyan-500 to-blue-500'} h-3 rounded-full transition-all duration-1000" 
                 style="width: ${Math.min(portfolioPercentage, 100)}%"></div>
          </div>
          <div class="text-xs text-gray-400 text-center">
            ${isAtLimit ? 
              'GitHub Pages limit reached (2 portfolios max)' : 
              isNearLimit ? 
              'Approaching GitHub Pages limit' : 
              'Free tier: GitHub Pages deployment'
            }
          </div>
          ${isAtLimit ? `
            <div class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div class="flex items-center space-x-2">
                ${createIcon('AlertTriangle', 'w-4 h-4 text-red-400')}
                <span class="text-sm text-red-400 font-medium">Portfolio Limit Reached</span>
              </div>
              <p class="text-xs text-red-300 mt-1">
                GitHub Pages allows maximum 2 portfolios per account. Delete a portfolio to create a new one.
              </p>
            </div>
          ` : ''}
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

  // Portfolio management methods
  async deployPortfolio(portfolioId) {
    try {
      const response = await apiService.deployPortfolio(portfolioId);
      if (response.success) {
        alert(`Portfolio deployed successfully! URL: ${response.url}`);
        await this.loadPortfolios(); // Refresh the list
      } else {
        alert(`Failed to deploy portfolio: ${response.message}`);
      }
    } catch (error) {
      console.error('Error deploying portfolio:', error);
      alert('Failed to deploy portfolio. Please try again.');
    }
  }

  async deletePortfolio(portfolioId) {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deletePortfolio(portfolioId);
      if (response.success) {
        alert('Portfolio deleted successfully!');
        await this.loadPortfolios(); // Refresh the list
      } else {
        alert(`Failed to delete portfolio: ${response.message}`);
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Failed to delete portfolio. Please try again.');
    }
  }

  editPortfolio(portfolioId) {
    // TODO: Navigate to portfolio editor
    console.log('Edit portfolio:', portfolioId);
    alert('Portfolio editor coming soon!');
  }

  viewPortfolio(portfolioId) {
    // TODO: Navigate to portfolio viewer
    console.log('View portfolio:', portfolioId);
    alert('Portfolio viewer coming soon!');
  }
}
