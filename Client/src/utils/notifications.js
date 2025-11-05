// Notification utility for SkillSlate
import { createIcon } from './icons.js';

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 5000) {
    const id = Date.now() + Math.random();
    const notification = this.createNotification(id, message, type, duration);
    
    this.notifications.push({ id, element: notification });
    this.container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  createNotification(id, message, type, duration) {
    const colors = {
      success: {
        bg: 'bg-green-500/10 border-green-500/50',
        icon: 'text-green-400',
        iconName: 'Check'
      },
      error: {
        bg: 'bg-red-500/10 border-red-500/50',
        icon: 'text-red-400',
        iconName: 'AlertTriangle'
      },
      warning: {
        bg: 'bg-yellow-500/10 border-yellow-500/50',
        icon: 'text-yellow-400',
        iconName: 'AlertTriangle'
      },
      info: {
        bg: 'bg-cyan-500/10 border-cyan-500/50',
        icon: 'text-cyan-400',
        iconName: 'Sparkles'
      }
    };

    const config = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = `${config.bg} border backdrop-blur-sm rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md transform translate-x-full opacity-0 transition-all duration-300 pointer-events-auto`;
    notification.dataset.notificationId = id;

    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          ${createIcon(config.iconName, `w-5 h-5 ${config.icon}`)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white leading-relaxed">${message}</p>
        </div>
        <button 
          class="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          onclick="window.notifications.remove(${id})"
        >
          ${createIcon('X', 'w-4 h-4')}
        </button>
      </div>
    `;

    return notification;
  }

  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const { element } = this.notifications[index];
      element.classList.add('translate-x-full', 'opacity-0');
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.notifications.splice(index, 1);
      }, 300);
    }
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 7000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }

  // Confirmation dialog
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm Action',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'warning'
      } = options;

      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in';

      const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        warning: 'from-yellow-500 to-orange-600',
        info: 'from-cyan-500 to-blue-600'
      };

      overlay.innerHTML = `
        <div class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full transform scale-95 opacity-0 transition-all duration-200" id="confirm-dialog">
          <div class="p-6">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${colors[type] || colors.warning} flex items-center justify-center flex-shrink-0">
                ${createIcon('AlertTriangle', 'w-6 h-6 text-white')}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
                <p class="text-gray-300 text-sm leading-relaxed">${message}</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <button 
                id="confirm-cancel"
                class="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
              >
                ${cancelText}
              </button>
              <button 
                id="confirm-accept"
                class="flex-1 px-4 py-2.5 bg-gradient-to-r ${colors[type] || colors.warning} hover:opacity-90 text-white rounded-lg font-semibold transition-opacity shadow-lg"
              >
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Animate in
      setTimeout(() => {
        const dialog = overlay.querySelector('#confirm-dialog');
        if (dialog) {
          dialog.classList.remove('scale-95', 'opacity-0');
          dialog.classList.add('scale-100', 'opacity-100');
        }
      }, 10);

      const cleanup = () => {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 200);
      };

      overlay.querySelector('#confirm-accept').addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
    });
  }

  // Loading overlay
  showLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';

    overlay.innerHTML = `
      <div class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-sm w-full">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <p class="text-white font-medium text-center">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}

// Create and export global notification instance
export const notifications = new NotificationManager();

// Make it globally accessible
if (typeof window !== 'undefined') {
  window.notifications = notifications;
}
