import { createIcon } from '../utils/icons.js';
import { apiService } from '../utils/api.js';
import { notifications } from '../utils/notifications.js';

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
    this.deploymentUrl = null;
    this.customRepoName = null; // User can customize repo name before deployment
    this.isDeploying = false; // Track deployment state
    this.showRefinementChat = false; // Track refinement chat visibility
    this.refinementMessages = []; // Store chat messages
    this.refinementInput = ''; // Store current input
  }
  
  async loadExistingPortfolio(portfolioId) {
    try {
      console.log('📂 Loading existing portfolio:', portfolioId);
      
      // Fetch portfolio from API
      const response = await apiService.getPortfolio(portfolioId);
      console.log('📦 Portfolio response:', response);
      
      if (response.success && response.portfolio) {
        const portfolio = response.portfolio;
        
        this.portfolioId = portfolio.id || portfolio._id;
        this.portfolioData = portfolio.data;
        this.portfolioHtml = portfolio.html;
        this.inputMethod = portfolio.generationType || 'prompt';
        
        // Enhanced logging to see portfolio structure
        console.log('📋 Full portfolio object:', portfolio);
        console.log('📋 Portfolio.data:', portfolio.data);
        console.log('📋 Available prompt fields:', {
          'portfolio.prompt': portfolio.prompt,
          'portfolio.data?.prompt': portfolio.data?.prompt,
          'portfolio.data?.description': portfolio.data?.description,
          'portfolio.description': portfolio.description,
          'portfolio.metadata': portfolio.metadata,
          'portfolio.inputData': portfolio.inputData
        });
        
        // Set the prompt or resume info from portfolio data
        if (this.inputMethod === 'prompt') {
          // Try to get prompt from various possible locations
          this.prompt = portfolio.prompt || 
                       portfolio.inputData || 
                       portfolio.data?.prompt || 
                       portfolio.data?.inputData ||
                       portfolio.data?.description || 
                       portfolio.description ||
                       portfolio.metadata?.prompt ||
                       'Portfolio created from prompt';
          console.log('💬 Prompt set to:', this.prompt.substring(0, 100));
        } else if (this.inputMethod === 'resume') {
          // Create a mock file object for display
          this.resumeFile = {
            name: portfolio.data?.resumeName || 'Uploaded Resume',
            size: portfolio.data?.resumeSize || 0
          };
          console.log('📄 Resume file:', this.resumeFile);
        }
        
        // Set to preview mode
        this.step = 'preview';
        console.log('✅ Portfolio loaded successfully, step set to preview');
      } else {
        throw new Error('Portfolio not found');
      }
    } catch (error) {
      console.error('❌ Error loading portfolio:', error);
      notifications.error(`Failed to load portfolio: ${error.message}`);
      this.step = 'input';
    }
  }

  render() {
    const useSplitView = this.step === 'generating' || this.step === 'preview';
    
    return `
      <div class="min-h-screen ${useSplitView ? 'py-4' : 'py-8'}">
        <div class="${useSplitView ? 'w-full px-6' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'}">
          ${this.renderHeader()}
          ${this.renderStepContent()}
        </div>
      </div>
    `;
  }

  getDefaultRepoName() {
    const portfolioName = this.portfolioData?.name || 
                         this.user?.name?.replace(/\s+/g, '-').toLowerCase() || 
                         'portfolio';
    return `${portfolioName}-portfolio`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  renderHeader() {
    const useSplitView = this.step === 'generating' || this.step === 'preview';
    return `
      <div class="${useSplitView ? 'mb-3' : 'mb-8'} animate-fade-in-up">
        <div class="flex items-center justify-between ${useSplitView ? 'mb-2' : 'mb-6'}">
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
        return this.renderSplitView(this.renderGeneratingStep());
      case 'preview':
        return this.renderSplitView(this.renderPreviewStep());
      case 'complete':
        return this.renderCompleteStep();
      default:
        return this.renderInputStep();
    }
  }

  renderSplitView(rightContent) {
    return `
      <div class="flex gap-4 h-[calc(100vh-120px)]">
        <!-- Left Panel - Input Context (30%) -->
        <div class="w-[30%] flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
          <!-- Panel Header -->
          <div class="px-6 py-4 border-b border-gray-700 bg-gray-900/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  ${createIcon(this.inputMethod === 'prompt' ? 'FileText' : 'Upload', 'w-4 h-4 text-white')}
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-white">Your Input</h3>
                  <p class="text-xs text-gray-400">${this.inputMethod === 'prompt' ? 'Text Prompt' : 'Resume'}</p>
                </div>
              </div>
              ${this.step === 'preview' ? `
                <button
                  id="back-to-input"
                  class="text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1 px-3 py-1.5 rounded-md hover:bg-gray-800"
                >
                  ${createIcon('ArrowLeft', 'w-3 h-3')}
                  <span>Edit</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Input Content / Refinement Chat -->
          <div class="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
            ${!this.showRefinementChat ? `
              ${this.inputMethod === 'prompt' ? `
                <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
                  <p class="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">${this.prompt}</p>
                </div>
              ` : `
                <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
                  ${this.resumeFile ? `
                    <div class="flex items-start space-x-3">
                      <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        ${createIcon('FileText', 'w-5 h-5 text-purple-400')}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">${this.resumeFile.name}</p>
                        <p class="text-xs text-gray-400 mt-1">${(this.resumeFile.size / 1024).toFixed(1)} KB</p>
                        <div class="flex items-center space-x-1 mt-2">
                          ${createIcon('Check', 'w-3 h-3 text-green-400')}
                          <span class="text-xs text-green-400">Uploaded successfully</span>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              `}
            ` : `
              <!-- Refinement Chat Interface -->
              <div class="flex flex-col h-full">
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                  <h4 class="text-sm font-semibold text-white flex items-center space-x-2">
                    ${createIcon('Sparkles', 'w-4 h-4 text-cyan-400')}
                    <span>Refine with AI</span>
                  </h4>
                  <button
                    id="close-refinement-chat"
                    class="text-gray-400 hover:text-white transition-colors"
                  >
                    ${createIcon('X', 'w-4 h-4')}
                  </button>
                </div>
                
                <!-- Chat Messages -->
                <div id="refinement-messages" class="flex-1 overflow-y-auto space-y-3 mb-3">
                  ${this.refinementMessages.length === 0 ? `
                    <div class="text-center py-8">
                      <div class="w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        ${createIcon('Sparkles', 'w-6 h-6 text-cyan-400')}
                      </div>
                      <p class="text-sm text-gray-400">Tell me what you'd like to change</p>
                      <p class="text-xs text-gray-500 mt-1">E.g., "Make it more colorful", "Add a skills section"</p>
                    </div>
                  ` : this.refinementMessages.map(msg => `
                    <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                      <div class="max-w-[85%] ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-700'} rounded-lg px-3 py-2">
                        <p class="text-xs text-white leading-relaxed">${msg.content}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <!-- Chat Input -->
                <div class="border-t border-gray-700 pt-3">
                  <div class="flex items-end space-x-2">
                    <textarea
                      id="refinement-input"
                      placeholder="Describe your changes..."
                      rows="2"
                      class="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-xs resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                    >${this.refinementInput}</textarea>
                    <button
                      id="send-refinement"
                      class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                      ${!this.refinementInput.trim() ? 'disabled opacity-50 cursor-not-allowed' : ''}
                    >
                      ${createIcon('ArrowRight', 'w-4 h-4')}
                    </button>
                  </div>
                </div>
              </div>
            `}
          </div>

          <!-- Action Panel (preview only) -->
          ${this.step === 'preview' ? `
            <div class="px-6 py-4 border-t border-gray-700 bg-gray-900/50 space-y-3">
              <!-- Repository Name Input -->
              <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <label class="block text-xs font-medium text-gray-400 mb-1.5">
                  ${createIcon('Github', 'w-3 h-3 inline mr-1')}Repository Name
                </label>
                <div class="flex items-center space-x-1.5">
                  <input
                    type="text"
                    id="repo-name-input"
                    value="${this.customRepoName || this.getDefaultRepoName()}"
                    placeholder="my-portfolio"
                    class="flex-1 bg-gray-900/50 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    id="reset-repo-name"
                    class="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5 hover:bg-gray-700/50 rounded transition-colors"
                    title="Reset to default"
                  >
                    ${createIcon('RotateCcw', 'w-3 h-3')}
                  </button>
                </div>
                <p class="text-[10px] text-gray-500 mt-1">
                  Only lowercase, numbers, hyphens
                </p>
              </div>
              
              <button
                id="deploy-btn"
                class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                ${createIcon('Rocket', 'w-5 h-5')}
                <span>Deploy Portfolio</span>
              </button>
              <button
                id="refine-btn"
                class="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                ${createIcon('Edit', 'w-4 h-4')}
                <span>Refine with AI</span>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Right Panel - Content (70%) -->
        <div class="w-[70%] flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
          ${rightContent}
        </div>
      </div>
    `;
  }

  renderInputStep() {
    return `
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-3">Create Your Portfolio with AI</h1>
          <p class="text-gray-400 text-lg">Let AI build a stunning portfolio in minutes</p>
        </div>

        <!-- Two Column Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <!-- Left Sidebar - Method Selection -->
          <div class="lg:col-span-1">
            <div class="glass-card p-8 h-full flex flex-col">
              <h3 class="text-xl font-semibold text-white mb-6">Choose Method</h3>
              <div class="space-y-5 flex-1">
                <!-- Text Prompt Card -->
                <button
                  data-input-method="prompt"
                  class="w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                    this.inputMethod === 'prompt'
                      ? 'border-cyan-500 bg-cyan-500/10 neon-glow'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }"
                >
                  <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      ${createIcon('FileText', 'w-6 h-6 text-white')}
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-white mb-2 text-base">Text Prompt</h4>
                      <p class="text-gray-400 text-sm mb-2">
                        Describe yourself and AI will create your portfolio
                      </p>
                      <p class="text-cyan-400 text-sm">⏱️ ~2-3 minutes</p>
                    </div>
                  </div>
                </button>

                <!-- Upload Resume Card -->
                <button
                  data-input-method="resume"
                  class="w-full p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                    this.inputMethod === 'resume'
                      ? 'border-purple-500 bg-purple-500/10 neon-glow'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }"
                >
                  <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      ${createIcon('Upload', 'w-6 h-6 text-white')}
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-white mb-2 text-base">Upload Resume</h4>
                      <p class="text-gray-400 text-sm mb-2">
                        Upload PDF/DOCX and AI extracts everything
                      </p>
                      <p class="text-purple-400 text-sm">⏱️ ~3-5 minutes</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Main Content - Input Area -->
          <div class="lg:col-span-2">
            <div class="glass-card p-10 h-full animate-fade-in">
              ${this.inputMethod === 'prompt' ? this.renderPromptInput() : this.renderResumeUpload()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPromptInput() {
    return `
      <div class="flex flex-col h-full">
        <div class="mb-6">
          <label class="block text-xl font-semibold text-white mb-3">Tell AI about yourself</label>
          <p class="text-gray-400 text-base">
            Share your skills, experience, projects, and achievements
          </p>
        </div>

        <textarea
          id="prompt-input"
          placeholder="I'm a full-stack developer with 5 years of experience in React, Node.js, and Python. I've built e-commerce platforms, SaaS applications, and mobile apps. I'm passionate about clean code and user experience..."
          class="w-full h-44 px-5 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white text-base placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-colors"
        >${this.prompt}</textarea>
        <div class="flex items-center justify-end mt-3 mb-5">
          <span id="char-count" class="text-base text-gray-500">
            ${this.prompt.length} / 2000
          </span>
        </div>

        <button
          id="generate-btn"
          class="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-lg font-semibold mt-auto"
          ${this.isGenerating ? 'disabled' : ''}
        >
          ${this.isGenerating ? `
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
            <span>Generating...</span>
          ` : `
            ${createIcon('Sparkles', 'w-6 h-6')}
            <span>Generate Portfolio with AI</span>
          `}
        </button>
      </div>
    `;
  }

  renderResumeUpload() {
    return `
      <div class="flex flex-col h-full">
        <div class="mb-6">
          <label class="block text-xl font-semibold text-white mb-3">Upload Your Resume</label>
          <p class="text-gray-400 text-base">
            AI will automatically extract your information and create a portfolio
          </p>
        </div>

        <div 
          id="resume-drop-zone"
          class="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-800/30 hover:border-purple-500 transition-all duration-300 cursor-pointer mb-5"
        >
          ${this.resumeFile ? `
            <div class="space-y-2">
              <div class="flex items-center justify-center space-x-3 text-green-400">
                ${createIcon('Check', 'w-5 h-5')}
                <span class="font-semibold text-base">${this.resumeFile.name}</span>
              </div>
              <p class="text-sm text-gray-400">
                ${(this.resumeFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                id="remove-resume"
                class="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Remove file
              </button>
            </div>
          ` : `
            <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              ${createIcon('Upload', 'w-7 h-7 text-white')}
            </div>
            <h3 class="text-base font-semibold text-white mb-2">Drop your resume here</h3>
            <p class="text-gray-400 text-sm mb-3">or click to browse</p>
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc"
              class="hidden"
            />
            <button
              id="browse-resume"
              class="btn-primary inline-flex items-center space-x-2"
            >
              ${createIcon('Upload', 'w-5 h-5')}
              <span>Choose File</span>
            </button>
            <p class="text-xs text-gray-500 mt-3">
              Supports: PDF, DOCX • Max: 5MB
            </p>
          `}
        </div>

        <button
          id="generate-btn"
          class="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-lg font-semibold mt-auto"
          ${!this.resumeFile || this.isGenerating ? 'disabled opacity-50 cursor-not-allowed' : ''}
        >
          ${this.isGenerating ? `
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin"></div>
            <span>Processing Resume...</span>
          ` : `
            ${createIcon('Sparkles', 'w-6 h-6')}
            <span>Generate Portfolio from Resume</span>
          `}
        </button>
      </div>
    `;
  }



  renderGeneratingStep() {
    const stages = [
      { step: 'initialize', label: 'Initializing AI', icon: 'Sparkles', desc: 'Starting generation process' },
      { step: 'parsing', label: 'Processing Input', icon: 'FileText', desc: 'Reading your information' },
      { step: 'analyzing', label: 'AI Analysis', icon: 'Search', desc: 'Understanding context' },
      { step: 'structuring', label: 'Building Structure', icon: 'Layout', desc: 'Creating portfolio layout' },
      { step: 'designing', label: 'Applying Design', icon: 'Palette', desc: 'Styling your website' },
      { step: 'finalizing', label: 'Finalizing', icon: 'Check', desc: 'Completing generation' }
    ];

    const currentStageIndex = stages.findIndex(s => s.step === this.generationMessage);

    return `
      <div class="flex-1 flex flex-col p-6 animate-fade-in">
        <!-- Header -->
        <div class="mb-5">
          <div class="flex items-center space-x-4 mb-4">
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                ${createIcon('Sparkles', 'w-7 h-7 text-white')}
              </div>
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-900 animate-bounce"></div>
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-white mb-1 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI Portfolio Generation
              </h2>
              <p class="text-sm text-gray-400">Estimated time: ~${Math.ceil(this.estimatedTime / 60)} minute${this.estimatedTime >= 120 ? 's' : ''}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="relative">
            <div class="h-2.5 bg-gray-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700">
              <div 
                class="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style="width: ${this.generationProgress}%"
              ></div>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs text-gray-500 font-medium">Progress</span>
              <span class="text-sm font-bold text-cyan-400">${this.generationProgress}%</span>
            </div>
          </div>
        </div>

        <!-- Generation Stages - Split View -->
        <div class="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-2">
          ${stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return `
              <div class="flex flex-col space-y-2 p-3 rounded-xl transition-all duration-300 ${
                isCurrent ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10' : 
                isCompleted ? 'bg-gray-800/60 border border-gray-700/50' : 
                'bg-gray-800/30 border border-gray-700/30'
              }">
                <!-- Icon & Title -->
                <div class="flex items-center space-x-2">
                  <div class="relative flex-shrink-0">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-gray-700/80 border border-gray-600/50 shadow-lg shadow-gray-400/20' :
                      isCurrent ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30 animate-pulse' :
                      'bg-gray-700/50 border border-gray-600'
                    }">
                      ${createIcon(stage.icon, `w-5 h-5 ${
                        isCompleted ? 'text-gray-300 opacity-60' :
                        isCurrent ? 'text-white' : 
                        'text-gray-500'
                      }`)}
                    </div>
                    ${isCompleted ? `
                      <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent opacity-50 blur-sm"></div>
                    ` : ''}
                  </div>
                  <h3 class="font-semibold text-sm ${
                    isCurrent ? 'text-cyan-400' :
                    isCompleted ? 'text-gray-300' :
                    'text-gray-500'
                  }">${stage.label}</h3>
                </div>
                
                <!-- Description -->
                <p class="text-xs ${
                  isCurrent ? 'text-cyan-300/80' :
                  isCompleted ? 'text-gray-400' :
                  'text-gray-600'
                } pl-11">${stage.desc}</p>
                
                <!-- Current indicator -->
                ${isCurrent ? `
                  <div class="flex space-x-1 pl-11">
                    <div class="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-3 border-t border-gray-700/50">
          <div class="flex items-center justify-center space-x-2 text-gray-400">
            <div class="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <p class="text-xs">Keep this window open while generating</p>
          </div>
        </div>
      </div>
    `;
  }

  renderPreviewStep() {
    return `
      <div class="flex flex-col h-full relative">
        <!-- Animated Background -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div class="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <!-- Preview Header -->
        <div class="px-8 py-5 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm relative z-10">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="relative">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  ${createIcon('Check', 'w-6 h-6 text-white')}
                </div>
                <div class="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-gray-900 animate-ping"></div>
                <div class="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white mb-0.5">Portfolio Ready!</h2>
                <p class="text-sm text-gray-400">Review your AI-generated portfolio below</p>
              </div>
            </div>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Preview</span>
            </div>
          </div>
        </div>

        <!-- Preview iFrame -->
        <div class="flex-1 p-4 bg-gray-800/30 backdrop-blur-sm relative z-10">
          <div class="h-full bg-white rounded-lg overflow-hidden shadow-2xl ring-1 ring-gray-700/50">
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
          <div class="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 neon-glow animate-bounce">
            ${createIcon('Check', 'w-10 h-10 text-white')}
          </div>
          
          <h2 class="text-3xl font-bold text-white mb-4">
            ${this.deploymentUrl ? 'Portfolio Deployed Successfully!' : 'Portfolio Created Successfully!'}
          </h2>
          <p class="text-gray-300 text-lg mb-8">
            ${this.deploymentUrl 
              ? 'Your portfolio is now live on GitHub Pages!' 
              : 'Your AI-generated portfolio is ready. View it from your dashboard.'}
          </p>

          ${this.deploymentUrl ? `
            <div class="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm text-gray-400">Your Portfolio URL:</span>
                <button
                  id="copy-url-btn"
                  class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  ${createIcon('Copy', 'w-3 h-3')}
                  <span>Copy</span>
                </button>
              </div>
              <a
                href="${this.deploymentUrl}"
                target="_blank"
                class="text-cyan-400 hover:text-cyan-300 text-lg font-mono break-all underline"
              >
                ${this.deploymentUrl}
              </a>
            </div>
          ` : ''}

          <div class="flex justify-center space-x-4">
            ${this.deploymentUrl ? `
              <a
                href="${this.deploymentUrl}"
                target="_blank"
                class="btn-primary inline-flex items-center space-x-2"
              >
                ${createIcon('ExternalLink', 'w-4 h-4')}
                <span>Visit Live Site</span>
              </a>
            ` : ''}
            <button
              data-nav="dashboard"
              class="px-6 py-3 ${this.deploymentUrl ? 'border border-gray-600 hover:border-gray-500 text-gray-300' : 'btn-primary'} rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              ${createIcon('Home', 'w-4 h-4')}
              <span>Go to Dashboard</span>
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
    // Load preview if we're in preview mode
    if (this.step === 'preview' && this.portfolioHtml) {
      console.log('🎬 attachEventListeners called in preview mode, loading preview');
      this.loadPreview();
    }
    
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

    // Back to input button
    const backToInputBtn = document.getElementById('back-to-input');
    if (backToInputBtn) {
      backToInputBtn.addEventListener('click', () => {
        this.step = 'input';
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    // Preview controls
    const refineBtn = document.getElementById('refine-btn');
    if (refineBtn) {
      refineBtn.addEventListener('click', () => {
        // Open refinement chat instead of showing prompt
        this.showRefinementChat = true;
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    // Refinement chat controls
    const closeRefinementChat = document.getElementById('close-refinement-chat');
    if (closeRefinementChat) {
      closeRefinementChat.addEventListener('click', () => {
        this.showRefinementChat = false;
        window.app.renderPage(this.render());
        this.attachEventListeners();
      });
    }

    const refinementInput = document.getElementById('refinement-input');
    if (refinementInput) {
      refinementInput.addEventListener('input', (e) => {
        this.refinementInput = e.target.value;
        // Re-render to update send button state
        const sendBtn = document.getElementById('send-refinement');
        if (sendBtn) {
          if (this.refinementInput.trim()) {
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          } else {
            sendBtn.disabled = true;
            sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
          }
        }
      });

      // Handle Enter key (Shift+Enter for new line, Enter to send)
      refinementInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const sendBtn = document.getElementById('send-refinement');
          if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
          }
        }
      });
    }

    const sendRefinementBtn = document.getElementById('send-refinement');
    if (sendRefinementBtn) {
      sendRefinementBtn.addEventListener('click', () => {
        this.handleRefinementMessage();
      });
    }

    const deployBtn = document.getElementById('deploy-btn');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => {
        this.handleDeploy();
      });
    }

    // Repository name input
    const repoNameInput = document.getElementById('repo-name-input');
    if (repoNameInput) {
      repoNameInput.addEventListener('input', (e) => {
        // Sanitize input: only lowercase, numbers, hyphens
        let value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        // Remove consecutive hyphens
        value = value.replace(/-+/g, '-');
        // Remove leading/trailing hyphens
        value = value.replace(/^-+|-+$/g, '');
        
        e.target.value = value;
        this.customRepoName = value;
      });
    }

    // Reset repo name button
    const resetRepoBtn = document.getElementById('reset-repo-name');
    if (resetRepoBtn) {
      resetRepoBtn.addEventListener('click', () => {
        this.customRepoName = null;
        const input = document.getElementById('repo-name-input');
        if (input) {
          input.value = this.getDefaultRepoName();
        }
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

    // Copy URL button
    const copyUrlBtn = document.getElementById('copy-url-btn');
    if (copyUrlBtn && this.deploymentUrl) {
      copyUrlBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.deploymentUrl);
          copyUrlBtn.innerHTML = `
            ${createIcon('Check', 'w-3 h-3')}
            <span>Copied!</span>
          `;
          setTimeout(() => {
            copyUrlBtn.innerHTML = `
              ${createIcon('Copy', 'w-3 h-3')}
              <span>Copy</span>
            `;
          }, 2000);
        } catch (error) {
          console.error('Failed to copy URL:', error);
          notifications.error('Failed to copy URL to clipboard');
        }
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
      notifications.warning('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      notifications.warning('File size must be less than 5MB');
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
      notifications.error(`Failed to generate portfolio: ${error.message}`);
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
    console.log('🖼️ Loading preview:', {
      iframeFound: !!iframe,
      hasHtml: !!this.portfolioHtml,
      htmlLength: this.portfolioHtml?.length
    });
    
    if (iframe && this.portfolioHtml) {
      iframe.srcdoc = this.portfolioHtml;
      console.log('✅ Preview loaded into iframe');
    } else {
      console.warn('⚠️ Cannot load preview:', {
        noIframe: !iframe,
        noHtml: !this.portfolioHtml
      });
    }
  }

  async handleRefinementMessage() {
    const message = this.refinementInput.trim();
    if (!message) return;

    // Add user message to chat
    this.refinementMessages.push({
      role: 'user',
      content: message
    });

    // Clear input
    this.refinementInput = '';

    // Update UI to show user message
    window.app.renderPage(this.render());
    this.attachEventListeners();

    // Scroll to bottom of messages
    setTimeout(() => {
      const messagesContainer = document.getElementById('refinement-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);

    try {
      // Add loading message
      this.refinementMessages.push({
        role: 'assistant',
        content: 'Refining your portfolio...'
      });
      window.app.renderPage(this.render());
      this.attachEventListeners();

      // Refine portfolio
      const response = await apiService.post(`/ai/portfolio/refine/${this.portfolioId}`, {
        request: message,
        conversationHistory: this.refinementMessages.slice(0, -1).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      // Remove loading message
      this.refinementMessages.pop();

      if (response.success) {
        // Update portfolio
        this.portfolioData = response.portfolio.data;
        this.portfolioHtml = response.portfolio.html;

        // Add success message
        this.refinementMessages.push({
          role: 'assistant',
          content: '✅ Portfolio updated! Check the preview on the right.'
        });

        // Update UI and reload preview
        window.app.renderPage(this.render());
        this.attachEventListeners();
        this.loadPreview();

        // Scroll to bottom
        setTimeout(() => {
          const messagesContainer = document.getElementById('refinement-messages');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      } else {
        throw new Error(response.message || 'Failed to refine portfolio');
      }

    } catch (error) {
      console.error('Refinement error:', error);
      
      // Remove loading message if exists
      if (this.refinementMessages.length > 0 && 
          this.refinementMessages[this.refinementMessages.length - 1].content === 'Refining your portfolio...') {
        this.refinementMessages.pop();
      }

      // Add error message
      this.refinementMessages.push({
        role: 'assistant',
        content: `❌ Sorry, refinement failed: ${error.message}`
      });

      window.app.renderPage(this.render());
      this.attachEventListeners();

      // Scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.getElementById('refinement-messages');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
  }

  async handleDeploy() {
    try {
      console.log('🚀 Starting deployment for portfolio:', this.portfolioId);
      
      // Check GitHub connection FIRST before showing progress UI
      console.log('🔍 Checking GitHub connection...');
      const githubStatus = await apiService.getGithubStatus();
      
      if (!githubStatus || !githubStatus.message || githubStatus.message !== 'GitHub connected') {
        // GitHub not connected - need to connect
        console.log('❌ GitHub not connected, requesting connection...');
        
        const confirmed = await notifications.confirm(
          'To deploy your portfolio to GitHub Pages, you need to connect your GitHub account. This will allow us to create a repository and publish your portfolio.',
          {
            title: 'Connect GitHub Account',
            confirmText: 'Connect GitHub',
            cancelText: 'Cancel',
            type: 'info'
          }
        );
        
        if (!confirmed) {
          this.step = 'preview';
          window.app.renderPage(this.render());
          this.attachEventListeners();
          return;
        }
        
        // Initiate GitHub OAuth flow
        const state = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('github_oauth_state', state);
        sessionStorage.setItem('deploy_after_github', this.portfolioId);
        
        notifications.info('Redirecting to GitHub for authorization...');
        
        const authResponse = await apiService.getGithubAuthUrl(state);
        
        if (authResponse.url) {
          setTimeout(() => {
            window.location.href = authResponse.url;
          }, 500);
          return;
        } else {
          throw new Error('Failed to initiate GitHub authentication');
        }
      }
      
      console.log('✅ GitHub connected, proceeding with deployment...');
      
      // Show deployment loading notification
      this.isDeploying = true;
      notifications.showLoading('🚀 Deploying to GitHub Pages...');
      
      // Get repository name - use custom name if set, otherwise use default
      const repoName = this.customRepoName || this.getDefaultRepoName();
      
      // Validate repository name
      if (!repoName || repoName.length < 1) {
        notifications.error('Repository name cannot be empty');
        this.step = 'preview';
        window.app.renderPage(this.render());
        this.attachEventListeners();
        return;
      }
      
      if (repoName.length > 100) {
        notifications.error('Repository name is too long (max 100 characters)');
        this.step = 'preview';
        window.app.renderPage(this.render());
        this.attachEventListeners();
        return;
      }
      
      console.log('📦 Repository name:', repoName);
      
      // Prepare files for deployment
      const files = [
        {
          path: 'index.html',
          content: this.portfolioHtml,
          encoding: 'utf-8'
        }
      ];
      
      console.log('📤 Deploying to GitHub Pages...');
      
      // Deploy using one-click deploy endpoint
      const deployResponse = await apiService.deployToGithub({
        repo: repoName,
        branch: 'main',
        path: '/',
        files: files,
        message: 'Deploy portfolio via SkillSlate'
      });
      
      if (!deployResponse.message || deployResponse.message !== 'Deployed') {
        throw new Error(deployResponse.message || 'Deployment failed');
      }
      
      console.log('✅ Deployment successful!');
      console.log('🌐 Portfolio URL:', deployResponse.url);
      
      // Hide loading notification
      notifications.hideLoading();
      this.isDeploying = false;
      
      // Update portfolio with deployment info
      await apiService.updatePortfolio(this.portfolioId, {
        status: 'deployed',
        url: deployResponse.url,
        githubRepo: repoName
      });
      
      // Show success notification
      notifications.success('🎉 Portfolio deployed successfully!', 5000);
      
      // Update state to complete
      this.step = 'complete';
      this.deploymentUrl = deployResponse.url;
      window.app.renderPage(this.render());
      this.attachEventListeners();
      
      // Don't auto-navigate - let user see the success page and deployment URL
      
    } catch (error) {
      console.error('❌ Deploy error:', error);
      
      // Hide loading notification
      notifications.hideLoading();
      this.isDeploying = false;
      
      let errorMessage = 'Failed to deploy portfolio';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      notifications.error(errorMessage, 8000);
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
    this.deploymentUrl = null;
  }
}
