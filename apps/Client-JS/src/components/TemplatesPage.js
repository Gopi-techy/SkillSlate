import { createIcon } from '../utils/icons.js';
import { templates } from '../data/templates.js';

export class TemplatesPage {
  constructor() {
    this.selectedCategory = 'all';
  }

  render() {
    const filteredTemplates = this.selectedCategory === 'all' 
      ? templates 
      : templates.filter(t => t.category === this.selectedCategory);

    return `
      <div class="min-h-screen py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16 animate-fade-in-up">
            <h1 class="text-4xl font-bold text-white mb-6">Portfolio Templates</h1>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose from our collection of professionally designed templates to showcase your unique story
            </p>
          </div>

          ${this.renderCategoryFilter()}
          ${this.renderTemplatesGrid(filteredTemplates)}
          ${this.renderCustomTemplateCTA()}
        </div>
      </div>
    `;
  }

  renderCategoryFilter() {
    const categories = [
      { id: 'all', label: 'All Templates' },
      { id: 'modern', label: 'Modern' },
      { id: 'creative', label: 'Creative' },
      { id: 'minimal', label: 'Minimal' }
    ];

    return `
      <div class="flex justify-center mb-12 animate-slide-in-right">
        <div class="flex glass-card p-2 border border-gray-700/50">
          ${categories.map(({ id, label }) => `
            <button
              data-category="${id}"
              class="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                this.selectedCategory === id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }"
            >
              ${label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderTemplatesGrid(templates) {
    return `
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${templates.map((template, index) => `
          <div class="glass-card overflow-hidden card-hover animate-fade-in-up" style="animation-delay: ${index * 0.1}s;">
            <div class="aspect-video bg-gray-800 overflow-hidden relative">
              <img
                src="${template.preview}"
                alt="${template.name}"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div class="p-6">
              <div class="flex items-start justify-between mb-6">
                <div>
                  <h3 class="text-xl font-semibold text-white mb-2">${template.name}</h3>
                  <p class="text-gray-300 text-sm">${template.description}</p>
                </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 capitalize">
                  ${template.category}
                </span>
              </div>
              <div class="flex space-x-3">
                <button class="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                  ${createIcon('Eye', 'w-4 h-4')}
                  <span>Preview</span>
                </button>
                <button class="flex-1 btn-primary py-3">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCustomTemplateCTA() {
    return `
      <div class="text-center mt-16 animate-fade-in-up">
        <p class="text-gray-300 mb-6 text-lg">Need something custom?</p>
        <button class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg">
          Request Custom Template
        </button>
      </div>
    `;
  }

  attachEventListeners() {
    // Category filter buttons
    document.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', (e) => {
        this.selectedCategory = e.target.getAttribute('data-category');
        this.render();
        this.attachEventListeners();
      });
    });
  }
}
