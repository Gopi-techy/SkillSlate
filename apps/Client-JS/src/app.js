import { Header } from './components/Header.js';
import { setupRoutes } from './routes.js';
import { apiService } from './utils/api.js';
import { Router } from './utils/router.js';
import { auth } from './utils/auth.js';

export class SkillSlateApp {
  constructor() {
    this.user = null;
    this.appContainer = document.getElementById('app');
    this.router = null;
  }

  async init() {
    console.log('🚀 SkillSlate App Initializing...');
    
    // Check authentication
    await this.checkAuth();
    
    // Setup router
    this.router = new Router(this);
    
    // Setup routes BEFORE router initialization
    setupRoutes(this);
    
    // Now initialize router (this will trigger initial navigation)
    this.router.init();
    
    // Add debug functions
    this.addDebugFunctions();
    
    console.log('✅ App initialized successfully');
  }

  async checkAuth() {
    const token = auth.getToken();
    const user = auth.getUser();
    if (token && user) {
      apiService.setToken(token);
      this.user = user;
      console.log('✅ User authenticated:', this.user.email);
    } else {
      this.user = null;
    }
  }

  handleAuth(user) {
    console.log('🔐 Auth state changed:', user ? 'logged in' : 'logged out');
    this.user = user;
    
    if (user) {
      const token = user.token;
      auth.setSession(user, token);
      apiService.setToken(token);
    } else {
      this.clearAuth();
    }
    
    this.render();
  }

  clearAuth() {
    this.user = null;
    auth.clear();
    apiService.setToken(null);
  }

  setUser(user) {
    this.user = user;
    this.render();
  }

  navigate(page) {
    if (this.router) {
      this.router.navigate(page);
    }
  }

  renderPage(content) {
    const header = new Header(
      this.user,
      (user) => this.handleAuth(user),
      (page) => this.navigate(page)
    );
    window.headerComponent = header;
    
    this.appContainer.innerHTML = `
      <div class="min-h-screen hero-bg">
        ${this.renderParticleBackground()}
        ${header.render()}
        ${content}
      </div>
    `;

    this.attachEventListeners();
  }

  render() {
    // This will be called by the router
    const currentRoute = this.router?.getCurrentRoute();
    if (currentRoute) {
      const handler = this.router.routes.get(currentRoute);
      if (handler) {
        const content = handler();
        this.renderPage(content);
      }
    }
  }

  renderParticleBackground() {
    return `
      <div class="particles" id="particles">
        ${Array.from({ length: 50 }, (_, i) => `
          <div class="particle" style="
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 8}s;
            animation-duration: ${8 + Math.random() * 12}s;
          "></div>
        `).join('')}
      </div>
    `;
  }

  attachEventListeners() {
    const currentRoute = this.router?.getCurrentRoute();
    
    // Attach page-specific event listeners
    if (currentRoute === 'landing' && window.landingPageComponent) {
      window.landingPageComponent.attachEventListeners();
    } else if ((currentRoute === 'login' || currentRoute === 'signup') && window.authPageComponent) {
      window.authPageComponent.attachEventListeners();
    } else if (currentRoute === 'dashboard' && window.dashboardComponent) {
      window.dashboardComponent.attachEventListeners();
    } else if (currentRoute === 'create' && window.createPortfolioComponent) {
      window.createPortfolioComponent.attachEventListeners();
    } else if (currentRoute === 'templates' && window.templatesPageComponent) {
      window.templatesPageComponent.attachEventListeners();
    }

    // Always attach header event listeners
    if (window.headerComponent) {
      window.headerComponent.attachEventListeners();
    }
  }

  addDebugFunctions() {
    window.app = this;
    window.debugApp = () => {
      console.log('=== APP DEBUG INFO ===');
      console.log('User:', this.user);
      console.log('Token:', localStorage.getItem('authToken'));
      console.log('Current Route:', this.router?.getCurrentRoute());
      console.log('=====================');
    };
    
    window.testNav = (page) => {
      console.log('🧪 Testing navigation to:', page);
      this.navigate(page);
    };
  }
}
