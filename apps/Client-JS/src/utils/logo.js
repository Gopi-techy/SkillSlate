// SkillSlate Logo Component
export function createLogo(className = '') {
  return `
    <div class="flex items-center space-x-3">
      <!-- Logo Icon -->
      <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="14" rx="2" fill="white" opacity="0.9"/>
          <rect x="5" y="6" width="14" height="10" rx="1" fill="none" stroke="#1f2937" stroke-width="1.5"/>
          <line x1="7" y1="9" x2="17" y2="9" stroke="#1f2937" stroke-width="1" opacity="0.6"/>
          <line x1="7" y1="12" x2="13" y2="12" stroke="#1f2937" stroke-width="1" opacity="0.4"/>
          <line x1="7" y1="15" x2="15" y2="15" stroke="#1f2937" stroke-width="1" opacity="0.4"/>
          <circle cx="9" cy="11" r="1" fill="#1f2937" opacity="0.7"/>
          <circle cx="15" cy="13" r="0.8" fill="#1f2937" opacity="0.5"/>
        </svg>
      </div>
      
      <!-- SkillSlate Text -->
      <span class="text-2xl font-bold gradient-text">SkillSlate</span>
    </div>
  `;
}

// Simple Logo Icon (for favicon/small sizes)
export function createLogoIcon(className = '') {
  return `
    <svg class="${className}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Portfolio Canvas -->
      <rect x="4" y="6" width="24" height="20" rx="3" fill="url(#iconGradient)"/>
      <rect x="6" y="8" width="20" height="16" rx="2" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
      
      <!-- Content Elements -->
      <rect x="8" y="11" width="16" height="2" rx="1" fill="white" opacity="0.8"/>
      <rect x="8" y="15" width="12" height="1.5" rx="0.8" fill="white" opacity="0.6"/>
      <rect x="8" y="18" width="14" height="1.5" rx="0.8" fill="white" opacity="0.6"/>
      
      <!-- Sparkle Points -->
      <circle cx="10" cy="13" r="1" fill="white" opacity="0.9"/>
      <circle cx="22" cy="19" r="0.8" fill="white" opacity="0.7"/>
      <circle cx="16" cy="21" r="0.6" fill="white" opacity="0.5"/>
    </svg>
  `;
}
