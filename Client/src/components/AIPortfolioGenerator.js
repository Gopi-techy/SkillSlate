import { createIcon } from '../utils/icons.js';
import { apiService } from '../utils/api.js';

export class AIPortfolioGenerator {
  constructor(user, onNavigate, onComplete) {
    this.user = user;
    this.onNavigate = onNavigate;
    this.onComplete = onComplete;
    this.step = 'input'; // input, generating, preview, complete
    this.inputMethod = 'prompt';
    this.prompt = '';
    this.resumeFile = null;
    this.isGenerating = false;
    this.generationProgress = 0;
    this.generationMessage = '';
    this.estimatedTime = 0;
    this.portfolioData = null;
    this.portfolioHtml = null;
    this.portfolioId = null;
  }

  render() {
    return `
      <div class="min-h-screen py-8">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          ${this.renderHeader()}
          ${this.renderStepContent()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="mb-8 animate-fade-in-up">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-4xl font-bold text-white mb-2 gradient-text">
              Create Your Portfolio with AI
            </h1>
            <p class="text-gray-300 text-lg">
              Let AI build a stunning portfolio in minutes
            </p>
          </div>
          ${this.step !== 'input' && !this.isGenerating ? `
            <button
              id="back-to-input"
              class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              ${createIcon('ArrowLeft', 'w-5 h-5')}
              <span>Start Over</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderStepContent() {
    switch (this.step) {
      case 'input':
        return this.renderInputStep();
      case 'generating':
        return this.renderGeneratingStep();
      case 'preview':
        return this.renderPreviewStep();
      case 'complete':
        return this.renderCompleteStep();
      default:
        return this.renderInputStep();
    }
  }

  renderInputStep() {
    return `
      <div class="max-w-4xl mx-auto">
        <!-- Single Card Container -->
        <div class="glass-card p-8 animate-fade-in">
          <h2 class="text-2xl font-semibold text-white mb-6 text-center">Create Your Portfolio</h2>
          
          <!-- Input Method Selection -->
          <div class="space-y-4 mb-8">
            <button
              data-input-method="prompt"
              class="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                this.inputMethod === 'prompt'
                  ? 'border-cyan-500 bg-cyan-500/10 neon-glow'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }"
            >
              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  ${createIcon('FileText', 'w-6 h-6 text-white')}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-white mb-2 text-lg">Text Prompt</h3>
                  <p class="text-gray-300 text-sm">
                    Describe yourself and AI will create your portfolio
                  </p>
                  <p class="text-cyan-400 text-xs mt-2">⏱️ ~2-3 minutes</p>
                </div>
              </div>
            </button>

            <button
              data-input-method="resume"
              class="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                this.inputMethod === 'resume'
                  ? 'border-purple-500 bg-purple-500/10 neon-glow'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }"
            >
              <div class="flex items-start space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  ${createIcon('Upload', 'w-6 h-6 text-white')}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-white mb-2 text-lg">Upload Resume</h3>
                  <p class="text-gray-300 text-sm">
                    Upload PDF/DOCX and AI extracts everything
                  </p>
                  <p class="text-purple-400 text-xs mt-2">⏱️ ~3-5 minutes</p>
                </div>
              </div>
            </button>
          </div>

          <!-- Input Area -->
          <div class="space-y-6">
            ${this.inputMethod === 'prompt' ? this.renderPromptInput() : this.renderResumeUpload()}
          </div>
        </div>
      </div>
    `;
  }

  renderPromptInput() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Tell AI about yourself
        </label>
        <textarea
          id="prompt-input"
          placeholder="Example: I'm a full-stack developer with 5 years of experience in React, Node.js, and Python. I've built e-commerce platforms, SaaS applications, and mobile apps. I'm passionate about clean code and user experience..."
          class="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-colors"
        >${this.prompt}</textarea>
        <div class="flex items-center justify-between mt-3">
          <p class="text-sm text-gray-400">
            Include: skills, experience, projects, achievements
          </p>
          <span id="char-count" class="text-sm text-gray-500">
            ${this.prompt.length} / 2000
          </span>
        </div>
      </div>

      <button
        id="generate-btn"
        class="w-full btn-primary flex items-center justify-center space-x-2"
        ${this.isGenerating ? 'disabled' : ''}
      >
        ${this.isGenerating ? `
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
          <span>Generating...</span>
        ` : `
          ${createIcon('Sparkles', 'w-5 h-5')}
          <span>Generate Portfolio with AI</span>
        `}
      </button>
    `;
  }

  renderResumeUpload() {
    return `
      <div>
        <div 
          id="resume-drop-zone"
          class="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center bg-gray-800/30 hover:border-purple-500 transition-all duration-300 cursor-pointer"
        >
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            ${createIcon('Upload', 'w-8 h-8 text-white')}
          </div>
          
          ${this.resumeFile ? `
            <div class="space-y-3">
              <div class="flex items-center justify-center space-x-3 text-green-400">
                ${createIcon('Check', 'w-5 h-5')}
                <span class="font-medium">${this.resumeFile.name}</span>
              </div>
              <p class="text-sm text-gray-400">
                ${(this.resumeFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                id="remove-resume"
                class="text-red-400 hover:text-red-300 text-sm"
              >
                Remove file
              </button>
            </div>
          ` : `
            <h3 class="text-xl font-semibold text-white mb-2">Drop your resume here</h3>
            <p class="text-gray-300 mb-4">or click to browse</p>
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc"
              class="hidden"
            />
            <button
              id="browse-resume"
              class="btn-primary"
            >
              Choose File
            </button>
            <p class="text-sm text-gray-400 mt-4">
              Supports: PDF, DOCX • Max: 5MB
            </p>
          `}
        </div>
      </div>

      <button
        id="generate-btn"
        class="w-full btn-primary flex items-center justify-center space-x-2"
        ${!this.resumeFile || this.isGenerating ? 'disabled opacity-50 cursor-not-allowed' : ''}
      >
        ${this.isGenerating ? `
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
          <span>Processing Resume...</span>
        ` : `
          ${createIcon('Sparkles', 'w-5 h-5')}
          <span>Generate from Resume</span>
        `}
      </button>
    `;
  }



  renderGeneratingStep() {
    const stages = [
      { step: 'initialize', label: 'Initializing AI', icon: 'Sparkles' },
      { step: 'parsing', label: 'Processing input', icon: 'FileText' },
      { step: 'analyzing', label: 'Analyzing information', icon: 'Search' },
      { step: 'structuring', label: 'Creating structure', icon: 'Layout' },
      { step: 'designing', label: 'Designing website', icon: 'Palette' },
      { step: 'finalizing', label: 'Finalizing portfolio', icon: 'Check' }
    ];

    const currentStageIndex = stages.findIndex(s => s.step === this.generationMessage);

    return `
      <div class="max-w-3xl mx-auto">
        <div class="glass-card p-12 text-center animate-fade-in">
          <!-- Animated Icon -->
          <div class="relative w-32 h-32 mx-auto mb-8">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse neon-glow"></div>
            <div class="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
              ${createIcon('Sparkles', 'w-16 h-16 text-cyan-400 animate-bounce')}
            </div>
          </div>

          <h2 class="text-3xl font-bold text-white mb-4">
            AI is Creating Your Portfolio
          </h2>
          <p class="text-gray-300 text-lg mb-8">
            This may take ${Math.ceil(this.estimatedTime / 60)} minute${this.estimatedTime >= 120 ? 's' : ''}
          </p>

          <!-- Progress Bar -->
          <div class="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-8">
            <div 
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style="width: ${this.generationProgress}%"
            ></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-xs font-semibold text-white drop-shadow-lg">
                ${this.generationProgress}%
              </span>
            </div>
          </div>

          <!-- Generation Stages -->
          <div class="space-y-3 mb-8">
            ${stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;

              return `
                <div class="flex items-center space-x-4 p-4 rounded-lg ${
                  isCurrent ? 'bg-cyan-500/10 border border-cyan-500/30' : 
                  isCompleted ? 'bg-gray-800/50' : 'bg-gray-800/30'
                }">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500/20 text-green-400' :
                    isCurrent ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' :
                    'bg-gray-700 text-gray-500'
                  }">
                    ${isCompleted ? createIcon('Check', 'w-4 h-4') : createIcon(stage.icon, 'w-4 h-4')}
                  </div>
                  <span class="flex-1 text-left text-sm font-medium ${
                    isCurrent ? 'text-cyan-400' :
                    isCompleted ? 'text-gray-400' :
                    'text-gray-600'
                  }">
                    ${stage.label}
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <p class="text-gray-400 text-sm">
            Please don't close this page. Your portfolio is being generated...
          </p>
        </div>
      </div>
    `;
  }

  renderPreviewStep() {
    return `
      <div class="space-y-6">
        <!-- Preview Controls -->
        <div class="glass-card p-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              ${createIcon('Check', 'w-5 h-5 text-green-400')}
            </div>
            <div>
              <h2 class="text-xl font-semibold text-white">Portfolio Generated!</h2>
              <p class="text-gray-400 text-sm">Review and customize before deploying</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button
              id="refine-btn"
              class="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg transition-colors"
            >
              ${createIcon('Edit', 'w-4 h-4 inline mr-2')}
              Refine
            </button>
            <button
              id="deploy-btn"
              class="btn-primary"
            >
              ${createIcon('Rocket', 'w-4 h-4 inline mr-2')}
              Deploy Portfolio
            </button>
          </div>
        </div>

        <!-- Preview iFrame -->
        <div class="glass-card p-4">
          <div class="bg-gray-900 rounded-lg overflow-hidden" style="height: 600px;">
            <iframe
              id="portfolio-preview"
              class="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>
        </div>
      </div>
    `;
  }

  renderCompleteStep() {
    return `
      <div class="max-w-2xl mx-auto text-center">
        <div class="glass-card p-12">
          <div class="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 neon-glow">
            ${createIcon('Check', 'w-10 h-10 text-white')}
          </div>
          
          <h2 class="text-3xl font-bold text-white mb-4">
            Portfolio Created Successfully!
          </h2>
          <p class="text-gray-300 text-lg mb-8">
            Your AI-generated portfolio is ready. View it from your dashboard.
          </p>

          <div class="flex justify-center space-x-4">
            <button
              data-nav="dashboard"
              class="btn-primary"
            >
              ${createIcon('Home', 'w-4 h-4 inline mr-2')}
              Go to Dashboard
            </button>
            <button
              id="create-another"
              class="px-6 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Back to input
    const backBtn = document.getElementById('back-to-input');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.resetState();
        this.step = 'input';
        this.render();
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    // Input method selection
    document.querySelectorAll('[data-input-method]').forEach(button => {
      button.addEventListener('click', () => {
        this.inputMethod = button.getAttribute('data-input-method');
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    });



    // Prompt input character count
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
      promptInput.addEventListener('input', (e) => {
        this.prompt = e.target.value;
        const charCount = document.getElementById('char-count');
        if (charCount) {
          charCount.textContent = `${this.prompt.length} / 2000`;
        }
      });
    }

    // Resume file handling
    const resumeDropZone = document.getElementById('resume-drop-zone');
    const resumeFileInput = document.getElementById('resume-file-input');
    const browseBtn = document.getElementById('browse-resume');
    const removeBtn = document.getElementById('remove-resume');

    if (browseBtn && resumeFileInput) {
      browseBtn.addEventListener('click', () => {
        resumeFileInput.click();
      });

      resumeFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleResumeFile(file);
        }
      });
    }

    if (resumeDropZone) {
      resumeDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        resumeDropZone.classList.add('border-purple-500');
      });

      resumeDropZone.addEventListener('dragleave', () => {
        resumeDropZone.classList.remove('border-purple-500');
      });

      resumeDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        resumeDropZone.classList.remove('border-purple-500');
        const file = e.dataTransfer.files[0];
        if (file) {
          this.handleResumeFile(file);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.resumeFile = null;
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    // Generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn && !generateBtn.disabled) {
      generateBtn.addEventListener('click', () => {
        this.handleGenerate();
      });
    }

    // Preview controls
    const refineBtn = document.getElementById('refine-btn');
    if (refineBtn) {
      refineBtn.addEventListener('click', () => {
        // TODO: Open refine dialog
        alert('Refinement feature coming soon!');
      });
    }

    const deployBtn = document.getElementById('deploy-btn');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        this.handleDeploy();
      });
    }

    // Create another
    const createAnotherBtn = document.getElementById('create-another');
    if (createAnotherBtn) {
      createAnotherBtn.addEventListener('click', () => {
        this.resetState();
        this.step = 'input';
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    // Navigation
    document.querySelectorAll('[data-nav]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const page = button.getAttribute('data-nav');
        if (page && this.onNavigate) {
          this.onNavigate(page);
        }
      });
    });
  }

  handleResumeFile(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    this.resumeFile = file;
    window.app.renderPage(this.render());
    this.attachEventListeners();
  }

  async handleGenerate() {
    try {
      this.isGenerating = true;
      this.step = 'generating';
      this.generationProgress = 0;
      window.app.renderPage(this.render());
      this.attachEventListeners();

      // Estimate time
      const estimateResponse = await apiService.post('/ai/portfolio/estimate-time', {
        generationType: this.inputMethod,
        hasResume: !!this.resumeFile
      });
      
      this.estimatedTime = estimateResponse.estimatedTime || 60;

      // Prepare form data
      const formData = new FormData();
      formData.append('generationType', this.inputMethod);

      if (this.inputMethod === 'resume' && this.resumeFile) {
        formData.append('resume', this.resumeFile);
      } else {
        formData.append('prompt', this.prompt);
      }

      // Simulate progress updates
      this.simulateProgress();

      // Generate portfolio
      const response = await apiService.postFormData('/ai/portfolio/generate', formData);

      if (response.success) {
        this.generationProgress = 100;
        this.portfolioData = response.portfolio.data;
        this.portfolioHtml = response.portfolio.html;
        this.portfolioId = response.portfolio.id;

        // Move to preview
        setTimeout(() => {
          this.isGenerating = false;
          this.step = 'preview';
          window.app.renderPage(this.render());
          this.attachEventListeners();
          this.loadPreview();
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to generate portfolio');
      }

    } catch (error) {
      console.error('Generation error:', error);
      this.isGenerating = false;
      this.step = 'input';
      window.app.renderPage(this.render());
      this.attachEventListeners();
      alert(`Failed to generate portfolio: ${error.message}`);
    }
  }

  simulateProgress() {
    const stages = [
      { progress: 10, message: 'initialize', duration: 500 },
      { progress: 20, message: 'parsing', duration: 1000 },
      { progress: 30, message: 'analyzing', duration: 2000 },
      { progress: 50, message: 'structuring', duration: 2000 },
      { progress: 70, message: 'designing', duration: 2000 },
      { progress: 90, message: 'finalizing', duration: 1000 }
    ];

    let currentIndex = 0;

    const updateProgress = () => {
      if (currentIndex < stages.length && this.isGenerating) {
        const stage = stages[currentIndex];
        this.generationProgress = stage.progress;
        this.generationMessage = stage.message;
        window.app.renderPage(this.render());
        this.attachEventListeners();

        currentIndex++;
        setTimeout(updateProgress, stage.duration);
      }
    };

    updateProgress();
  }

  loadPreview() {
    const iframe = document.getElementById('portfolio-preview');
    if (iframe && this.portfolioHtml) {
      iframe.srcdoc = this.portfolioHtml;
    }
  }

  async handleDeploy() {
    try {
      // Navigate to complete
      this.step = 'complete';
      window.app.renderPage(this.render());
      this.attachEventListeners();

      if (this.onComplete) {
        this.onComplete(this.portfolioId);
      }
    } catch (error) {
      console.error('Deploy error:', error);
      alert(`Failed to complete: ${error.message}`);
    }
  }

  resetState() {
    this.step = 'input';
    this.inputMethod = 'prompt';
    this.prompt = '';
    this.resumeFile = null;
    this.isGenerating = false;
    this.generationProgress = 0;
    this.generationMessage = '';
    this.estimatedTime = 0;
    this.portfolioData = null;
    this.portfolioHtml = null;
    this.portfolioId = null;
  }
}
