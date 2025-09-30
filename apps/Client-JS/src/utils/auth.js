// Centralized auth/session helper
export const auth = {
  tokenKey: 'authToken',
  userKey: 'currentUser',
  getToken() { return localStorage.getItem(this.tokenKey); },
  getUser() {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  isAuthenticated() { return !!(this.getToken() && this.getUser()); },
  setSession(user, token) {
    if (token) localStorage.setItem(this.tokenKey, token);
    if (user) localStorage.setItem(this.userKey, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
};


