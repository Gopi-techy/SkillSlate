import { createIcon } from '../utils/icons.js';

export class CreatePortfolio {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
    this.step = 'input';
    this.inputMethod = 'prompt';
    this.prompt = '';
    this.selectedTemplate = '';
    this.isGenerating = false;
    this.isDeploying = false;
  }

  render() {
    return `
      <div class="min-h-screen py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          ${this.renderProgressSteps()}
          ${this.renderStepContent()}
        </div>
      </div>
    `;
  }

  renderProgressSteps() {
    const steps = ['Input', 'Template', 'Preview', 'Deploy'];
    const currentStepIndex = ['input', 'template', 'preview', 'deploy'].indexOf(this.step);

    return `
      <div class="mb-12 animate-fade-in-up">
        <div class="flex items-center justify-between">
          ${steps.map((stepName, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return `
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white neon-glow'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }">
                  ${index + 1}
                </div>
                <span class="ml-3 text-sm font-medium transition-colors ${
                  isCurrent ? 'text-cyan-400' : isActive ? 'text-white' : 'text-gray-500'
                }">
                  ${stepName}
                </span>
                ${index < 3 ? `
                  ${createIcon('ChevronRight', `w-5 h-5 mx-4 transition-colors ${index < currentStepIndex ? 'text-cyan-400' : 'text-gray-600'}`)}
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderStepContent() {
    switch (this.step) {
      case 'input':
        return this.renderInputStep();
      case 'template':
        return this.renderTemplateStep();
      case 'preview':
        return this.renderPreviewStep();
      case 'deploy':
        return this.renderDeployStep();
      default:
        return this.renderInputStep();
    }
  }

  renderInputStep() {
    return `
      <div class="glass-card p-8 animate-slide-in-left">
        <h2 class="text-3xl font-bold text-white mb-8">Create Your Portfolio</h2>
        
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <button
            data-input-method="prompt"
            class="p-8 rounded-2xl border-2 transition-all duration-300 ${
              this.inputMethod === 'prompt'
                ? 'border-cyan-500 bg-cyan-500/10 neon-glow'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              ${createIcon('FileText', 'w-6 h-6 text-white')}
            </div>
            <h3 class="font-semibold text-white mb-3 text-lg">Write a Prompt</h3>
            <p class="text-gray-300 text-sm">
              Describe yourself and let AI create your portfolio content
            </p>
          </button>

          <button
            data-input-method="resume"
            class="p-8 rounded-2xl border-2 transition-all duration-300 ${
              this.inputMethod === 'resume'
                ? 'border-cyan-500 bg-cyan-500/10 neon-glow'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }"
          >
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              ${createIcon('Upload', 'w-6 h-6 text-white')}
            </div>
            <h3 class="font-semibold text-white mb-3 text-lg">Upload Resume</h3>
            <p class="text-gray-300 text-sm">
              Upload your PDF or DOCX resume for instant portfolio creation
            </p>
          </button>
        </div>

        ${this.inputMethod === 'prompt' ? this.renderPromptInput() : this.renderResumeUpload()}
      </div>
    `;
  }

  renderPromptInput() {
    return `
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-3">
            Tell us about yourself
          </label>
          <textarea
            id="prompt-input"
            placeholder="I'm a full-stack developer with 3 years of experience in React and Node.js. I've built several web applications and enjoy working on user-centered design..."
            class="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-colors"
            required
          ></textarea>
          <p class="text-sm text-gray-400 mt-3">
            Include your skills, experience, projects, and what makes you unique.
          </p>
        </div>

        <button
          id="generate-btn"
          class="btn-primary flex items-center space-x-2"
        >
          ${this.isGenerating ? `
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
            <span>Generating...</span>
          ` : `
            ${createIcon('Sparkles', 'w-5 h-5')}
            <span>Generate Portfolio</span>
          `}
        </button>
      </div>
    `;
  }

  renderResumeUpload() {
    return `
      <div class="space-y-6">
        <div class="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center bg-gray-800/30 hover:border-gray-500 transition-colors">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            ${createIcon('Upload', 'w-8 h-8 text-white')}
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">Upload your resume</h3>
          <p class="text-gray-300 mb-6">Drag and drop your PDF or DOCX file here, or click to browse</p>
          <button class="btn-primary">
            Choose File
          </button>
          <p class="text-sm text-gray-400 mt-4">Max file size: 5MB</p>
        </div>
      </div>
    `;
  }

  renderTemplateStep() {
    const templates = [
      {
        id: 'modern',
        name: 'Modern Professional',
        description: 'Clean, contemporary design perfect for tech professionals',
        preview: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'
      },
      {
        id: 'creative',
        name: 'Creative Showcase',
        description: 'Bold, artistic layout ideal for designers and creatives',
        preview: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'
      },
      {
        id: 'minimal',
        name: 'Minimal Elegance',
        description: 'Sophisticated simplicity for refined professionals',
        preview: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'
      }
    ];

    return `
      <div class="bg-white rounded-xl shadow-sm p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Choose Your Template</h2>
        
        <div class="grid md:grid-cols-3 gap-6">
          ${templates.map(template => `
            <button
              data-template="${template.id}"
              class="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all transform hover:scale-105"
            >
              <div class="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img
                  src="${template.preview}"
                  alt="${template.name}"
                  class="w-full h-full object-cover"
                />
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">${template.name}</h3>
              <p class="text-gray-600 text-sm">${template.description}</p>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderPreviewStep() {
    return `
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Preview Your Portfolio</h2>
            <div class="flex items-center space-x-4">
              <button
                id="change-template"
                class="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
              >
                Change Template
              </button>
              <button
                id="deploy-btn"
                class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                ${this.isDeploying ? `
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
                  <span>Deploying...</span>
                ` : `
                  ${createIcon('Rocket', 'w-5 h-5')}
                  <span>Deploy Portfolio</span>
                `}
              </button>
            </div>
          </div>

          <div class="bg-gray-100 rounded-lg p-8 min-h-96 flex items-center justify-center">
            <div class="text-center">
              ${createIcon('Eye', 'w-16 h-16 text-gray-400 mx-auto mb-4')}
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Portfolio Preview</h3>
              <p class="text-gray-600">
                Your ${this.selectedTemplate} template portfolio would appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderDeployStep() {
    return `
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          ${createIcon('Check', 'w-8 h-8 text-green-500')}
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Portfolio Deployed Successfully!</h2>
        <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
          Your portfolio is now live and accessible to the world. Share your unique URL and start impressing potential employers and clients.
        </p>

        <div class="bg-gray-50 rounded-lg p-4 mb-8">
          <p class="text-sm text-gray-600 mb-2">Your portfolio URL:</p>
          <div class="flex items-center justify-center space-x-2">
            <code class="bg-white px-4 py-2 rounded border text-blue-600 font-mono">
              https://johndoe.skillslate.app
            </code>
            <button class="p-2 text-gray-500 hover:text-gray-700 rounded">
              ${createIcon('ExternalLink', 'w-4 h-4')}
            </button>
          </div>
        </div>

        <div class="flex justify-center space-x-4">
          <button
            data-nav="dashboard"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </button>
          <button class="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors">
            View Live Portfolio
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Input method selection
    document.querySelectorAll('[data-input-method]').forEach(button => {
      button.addEventListener('click', (e) => {
        this.inputMethod = e.target.getAttribute('data-input-method');
        this.render();
        this.attachEventListeners();
      });
    });

    // Generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.handleGenerate();
      });
    }

    // Template selection
    document.querySelectorAll('[data-template]').forEach(button => {
      button.addEventListener('click', (e) => {
        this.selectedTemplate = e.target.getAttribute('data-template');
        this.step = 'preview';
        this.render();
        this.attachEventListeners();
      });
    });

    // Change template button
    const changeTemplateBtn = document.getElementById('change-template');
    if (changeTemplateBtn) {
      changeTemplateBtn.addEventListener('click', () => {
        this.step = 'template';
        this.render();
        this.attachEventListeners();
      });
    }

    // Deploy button
    const deployBtn = document.getElementById('deploy-btn');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        this.handleDeploy();
      });
    }

    // Navigation buttons
    document.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', (e) => {
        const page = e.target.getAttribute('data-nav');
        this.onNavigate(page);
      });
    });
  }

  handleGenerate() {
    this.isGenerating = true;
    this.render();
    this.attachEventListeners();

    setTimeout(() => {
      this.isGenerating = false;
      this.step = 'template';
      this.render();
      this.attachEventListeners();
    }, 2000);
  }

  handleDeploy() {
    this.isDeploying = true;
    this.render();
    this.attachEventListeners();

    setTimeout(() => {
      this.isDeploying = false;
      this.step = 'deploy';
      this.render();
      this.attachEventListeners();
    }, 3000);
  }
}
