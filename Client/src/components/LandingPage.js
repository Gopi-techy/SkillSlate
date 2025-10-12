import { createIcon } from '../utils/icons.js';
import { createLogo } from '../utils/logo.js';

export class LandingPage {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
  }

  render() {
    return `
      <div class="min-h-screen">
        <!-- Hero Section -->
        <div class="relative overflow-hidden pt-20 pb-24">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
              <!-- Hero Content -->
              <div class="animate-fade-in-up">
                <h1 class="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
                  Create Your Perfect
                  <span class="block gradient-text animate-pulse-slow">
                    AI Portfolio
                  </span>
                </h1>
                <p class="text-xl text-gray-300 mb-8 leading-relaxed">
                  Transform your resume or a simple prompt into a stunning, professional portfolio. 
                  Connect GitHub, enhance with AI, and deploy to the world in minutes.
                </p>
                <div class="flex justify-center">
                  <button
                    data-nav="signup"
                    class="btn-primary flex items-center space-x-2"
                  >
                    <span>Start Building Free</span>
                    ${createIcon('ArrowRight', 'w-5 h-5')}
                  </button>
                </div>
              </div>

              <!-- Curved Design Element -->
              <div class="relative max-w-4xl mx-auto animate-slide-in-right">
                <!-- Curved top section -->
                <div class="relative">
                  <svg class="w-full h-16 text-gray-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor" opacity="0.1"></path>
                    <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="currentColor" opacity="0.05"></path>
                  </svg>
                </div>
                
                <!-- Portfolio Preview -->
                <div class="glass-card p-8 border border-gray-700/50 animate-float -mt-8">
                  <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6">
                    <div class="flex items-center justify-start mb-6">
                      <div class="flex space-x-2">
                        <div class="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
                      </div>
                    </div>
                    
                    <!-- Mock portfolio preview -->
                    <div class="space-y-4">
                      <div class="h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded w-3/4 shimmer-effect"></div>
                      <div class="h-3 bg-gray-600 rounded w-1/2"></div>
                      <div class="grid grid-cols-3 gap-4 mt-6">
                        <div class="h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30 animate-pulse-slow"></div>
                        <div class="h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 animate-pulse-slow" style="animation-delay: 0.5s;"></div>
                        <div class="h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 animate-pulse-slow" style="animation-delay: 1s;"></div>
                      </div>
                      <div class="h-3 bg-gray-600 rounded w-full mt-4"></div>
                      <div class="h-3 bg-gray-600 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Grid -->
        <div class="py-24">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
              <h2 class="text-4xl font-bold text-white mb-4">Everything you need to shine</h2>
              <p class="text-xl text-gray-300 max-w-2xl mx-auto">
                From content creation to deployment, we've got every step covered
              </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              ${this.renderFeatures()}
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="py-24 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20"></div>
          <div class="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to build your portfolio?
            </h2>
            <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've already created their perfect portfolio with SkillSlate
            </p>
            <button
              data-nav="signup"
              class="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Now
            </button>
          </div>
        </div>

        <!-- Footer -->
        <footer class="relative bg-gray-900/50 backdrop-blur-xl border-t border-gray-700/50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <!-- Logo & Description -->
              <div class="col-span-1 md:col-span-2">
                <div class="mb-4">
                  ${createLogo()}
                </div>
                <p class="text-gray-300 mb-6 max-w-md">
                  Transform your resume into a stunning portfolio with AI-powered enhancement, 
                  GitHub integration, and one-click deployment.
                </p>
                <div class="flex space-x-4">
                  <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                    ${createIcon('Github', 'w-5 h-5 text-gray-300')}
                  </a>
                  <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                    ${createIcon('Globe', 'w-5 h-5 text-gray-300')}
                  </a>
                  <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                    ${createIcon('ExternalLink', 'w-5 h-5 text-gray-300')}
                  </a>
                </div>
              </div>

              <!-- Quick Links -->
              <div>
                <h3 class="text-white font-semibold mb-4">Product</h3>
                <ul class="space-y-3">
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Templates</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Examples</a></li>
                </ul>
              </div>

              <!-- Support -->
              <div>
                <h3 class="text-white font-semibold mb-4">Support</h3>
                <ul class="space-y-3">
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" class="text-gray-300 hover:text-white transition-colors">Status</a></li>
                </ul>
              </div>
            </div>

            <!-- Bottom Section -->
            <div class="border-t border-gray-700/50 mt-12 pt-8">
              <div class="flex flex-col md:flex-row justify-between items-center">
                <div class="text-gray-400 text-sm mb-4 md:mb-0">
                  © 2024 SkillSlate. All rights reserved.
                </div>
                <div class="flex space-x-6 text-sm">
                  <a href="#" class="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" class="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" class="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  renderFeatures() {
    const features = [
      {
        icon: createIcon('Sparkles', 'w-8 h-8 text-cyan-400'),
        title: 'AI Enhancement',
        description: 'Let AI perfect your content with intelligent suggestions and improvements'
      },
      {
        icon: createIcon('Github', 'w-8 h-8 text-purple-400'),
        title: 'GitHub Integration',
        description: 'Automatically import projects and showcase your coding expertise'
      },
      {
        icon: createIcon('Palette', 'w-8 h-8 text-pink-400'),
        title: 'Beautiful Templates',
        description: 'Choose from professionally designed templates that make you stand out'
      },
      {
        icon: createIcon('Rocket', 'w-8 h-8 text-orange-400'),
        title: 'One-Click Deploy',
        description: 'Publish your portfolio instantly to a global CDN with custom domains'
      }
    ];

    return features.map((feature, index) => `
      <div class="glass-card text-center p-8 card-hover animate-fade-in-up" style="animation-delay: ${index * 0.1}s;">
        <div class="mb-6 flex justify-center">
          <div class="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50 neon-glow">
            ${feature.icon}
          </div>
        </div>
        <h3 class="text-xl font-semibold text-white mb-4">${feature.title}</h3>
        <p class="text-gray-300 leading-relaxed">${feature.description}</p>
      </div>
    `).join('');
  }

  attachEventListeners() {
    document.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const page = button.getAttribute('data-nav');
        console.log('LandingPage navigation clicked:', page);
        if (page && this.onNavigate) {
          this.onNavigate(page);
        }
      });
    });
  }
}
