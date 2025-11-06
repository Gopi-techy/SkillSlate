import { createIcon } from '../utils/icons.js';
import { apiService } from '../utils/api.js';
import { notifications } from '../utils/notifications.js';

export class PortfolioPreview {
  constructor(user, portfolioId, onNavigate) {
    this.user = user;
    this.portfolioId = portfolioId;
    this.onNavigate = onNavigate;
    this.portfolio = null;
    this.loading = true;
    this.error = null;
  }

  async loadPortfolio() {
    try {
      console.log('📂 Loading portfolio for preview:', this.portfolioId);
      this.loading = true;
      
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      const response = await apiService.getPortfolio(this.portfolioId);
      console.log('📦 Portfolio response:', response);
      console.log('📦 Portfolio data keys:', response.portfolio ? Object.keys(response.portfolio) : 'no portfolio');
      
      if (response.success && response.portfolio) {
        this.portfolio = response.portfolio;
        this.loading = false;
        console.log('✅ Portfolio loaded successfully');
        console.log('📄 Portfolio HTML exists:', !!this.portfolio.html);
        console.log('📄 Portfolio content exists:', !!this.portfolio.content);
        console.log('📄 Portfolio generated_html exists:', !!this.portfolio.generated_html);
        
        // Re-render to show the portfolio
        window.app.renderPage(this.render());
        
        // Scroll to top again after render
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Load the preview after a short delay
        setTimeout(() => {
          this.loadPreview();
        }, 100);
      } else {
        throw new Error('Portfolio not found');
      }
    } catch (error) {
      console.error('❌ Error loading portfolio:', error);
      this.error = error.message;
      this.loading = false;
      notifications.error(`Failed to load portfolio: ${error.message}`);
      window.app.renderPage(this.render());
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  loadPreview() {
    // Get HTML from whichever property exists
    const portfolioHtml = this.portfolio?.html || this.portfolio?.content || this.portfolio?.generated_html;
    
    console.log('🖼️ Loading preview into iframe:', {
      hasPortfolio: !!this.portfolio,
      hasHtml: !!portfolioHtml,
      htmlLength: portfolioHtml?.length
    });
    
    // Wait for iframe to be in DOM
    setTimeout(() => {
      const iframe = document.getElementById('portfolio-preview-iframe');
      console.log('🔍 Iframe found:', !!iframe);
      
      if (iframe && portfolioHtml) {
        iframe.srcdoc = portfolioHtml;
        console.log('✅ Preview loaded successfully');
      } else {
        console.warn('⚠️ Cannot load preview:', {
          noIframe: !iframe,
          noHtml: !portfolioHtml
        });
        
        // Retry after another delay if iframe not found
        if (!iframe && portfolioHtml) {
          setTimeout(() => {
            const retryIframe = document.getElementById('portfolio-preview-iframe');
            if (retryIframe) {
              retryIframe.srcdoc = portfolioHtml;
              console.log('✅ Preview loaded on retry');
            }
          }, 200);
        }
      }
    }, 50);
  }

  render() {
    return `
      <div class="min-h-screen py-4">
        <div class="w-full px-6">
          ${this.renderHeader()}
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="mb-3 animate-fade-in-up">
        <div class="flex items-center mb-2">
          <button
            id="back-to-dashboard"
            class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            ${createIcon('ArrowLeft', 'w-5 h-5')}
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    `;
  }

  renderContent() {
    if (this.loading) {
      return this.renderLoading();
    }

    if (this.error) {
      return this.renderError();
    }

    return this.renderPreview();
  }

  renderLoading() {
    return `
      <div class="flex items-center justify-center h-[80vh]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p class="text-gray-400 text-lg">Loading portfolio...</p>
        </div>
      </div>
    `;
  }

  renderError() {
    return `
      <div class="flex items-center justify-center h-[80vh]">
        <div class="text-center max-w-md">
          <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            ${createIcon('X', 'w-8 h-8 text-red-500')}
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Failed to Load Portfolio</h2>
          <p class="text-gray-400 mb-6">${this.error}</p>
          <button
            id="retry-load"
            class="btn-primary inline-flex items-center space-x-2"
          >
            ${createIcon('RefreshCw', 'w-4 h-4')}
            <span>Try Again</span>
          </button>
        </div>
      </div>
    `;
  }

  renderPreview() {
    return `
      <div class="flex gap-4 h-[calc(100vh-120px)]">
        <!-- Left Panel - Portfolio Info (30%) -->
        <div class="w-[30%] flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
          <!-- Panel Header -->
          <div class="px-6 py-4 border-b border-gray-700 bg-gray-900/50">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                ${createIcon('FileText', 'w-4 h-4 text-white')}
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white">Portfolio Info</h3>
                <p class="text-xs text-gray-400">Created portfolio</p>
              </div>
            </div>
          </div>

          <!-- Portfolio Details -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-400 uppercase tracking-wide">Name</label>
                <p class="text-white font-medium mt-1">${this.portfolio.name || 'Untitled Portfolio'}</p>
              </div>
              
              <div>
                <label class="text-xs text-gray-400 uppercase tracking-wide">Status</label>
                <div class="mt-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    this.portfolio.status === 'deployed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : this.portfolio.status === 'building'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }">
                    ${this.portfolio.status === 'deployed' ? createIcon('Check', 'w-3 h-3 mr-1') : ''}
                    ${this.portfolio.status.charAt(0).toUpperCase() + this.portfolio.status.slice(1)}
                  </span>
                </div>
              </div>

              ${this.portfolio.url ? `
                <div>
                  <label class="text-xs text-gray-400 uppercase tracking-wide">Live URL</label>
                  <a 
                    href="${this.portfolio.url}" 
                    target="_blank"
                    class="text-cyan-400 hover:text-cyan-300 text-sm mt-1 block break-all underline"
                  >
                    ${this.portfolio.url}
                  </a>
                </div>
              ` : ''}

              <div>
                <label class="text-xs text-gray-400 uppercase tracking-wide">Created</label>
                <p class="text-white text-sm mt-1">
                  ${this.portfolio.createdAt ? new Date(this.portfolio.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>

              ${this.portfolio.lastDeployed ? `
                <div>
                  <label class="text-xs text-gray-400 uppercase tracking-wide">Last Deployed</label>
                  <p class="text-white text-sm mt-1">
                    ${new Date(this.portfolio.lastDeployed).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 border-t border-gray-700 bg-gray-900/50 space-y-3">
            ${this.portfolio.url ? `
              <a
                href="${this.portfolio.url}"
                target="_blank"
                class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                ${createIcon('ExternalLink', 'w-5 h-5')}
                <span>Open Live Site</span>
              </a>
            ` : ''}
            ${this.portfolio.status === 'draft' ? `
              <button
                id="deploy-draft-btn"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                ${createIcon('Rocket', 'w-5 h-5')}
                <span>Deploy to GitHub Pages</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Right Panel - Preview (70%) -->
        <div class="w-[70%] flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
          <!-- Preview Header -->
          <div class="px-8 py-5 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  ${createIcon('Eye', 'w-6 h-6 text-white')}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white mb-0.5">Portfolio Preview</h2>
                  <p class="text-sm text-gray-400">Live preview of your portfolio</p>
                </div>
              </div>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Preview</span>
              </div>
            </div>
          </div>

          <!-- Preview iFrame -->
          <div class="flex-1 p-4 bg-gray-800/30 backdrop-blur-sm">
            <div class="h-full bg-white rounded-lg overflow-hidden shadow-2xl ring-1 ring-gray-700/50">
              <iframe
                id="portfolio-preview-iframe"
                class="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    console.log('🔧 PortfolioPreview: Attaching event listeners');

    // Back to dashboard button
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log('🔙 Back button clicked');
        window.app.navigate('dashboard');
      }, { once: true });
    }

    // Deploy button (sidebar - for drafts)
    const deployDraftBtn = document.getElementById('deploy-draft-btn');
    if (deployDraftBtn) {
      deployDraftBtn.addEventListener('click', () => {
        this.handleDeploy();
      }, { once: true });
    }

    // Retry button
    const retryBtn = document.getElementById('retry-load');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.loadPortfolio();
      }, { once: true });
    }
  }

  async handleDeploy() {
    notifications.info('🚀 Deploy feature coming soon! This will deploy your portfolio to GitHub Pages.');
    // TODO: Implement deployment logic
  }
}
