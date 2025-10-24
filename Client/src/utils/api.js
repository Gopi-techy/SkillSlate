// API Service for SkillSlate Backend
import { auth } from './auth.js';

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = auth.getToken();
        console.log('🔧 ApiService initialized with token:', this.token ? 'present' : 'none');
    }

    // Set authentication token
    setToken(token) { 
        this.token = token;
        console.log('🔧 API token updated:', token ? 'set' : 'cleared');
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            return this.handleApiError(error, endpoint);
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(credentials) {
        // Support both email/password and GitHub OAuth login
        if (credentials.provider === 'github') {
            return this.request('/auth/github/login', {
                method: 'POST',
                body: JSON.stringify({
                    access_token: credentials.access_token
                }),
            });
        }
        
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            // Logout should work even if server call fails
            console.warn('Logout API call failed:', error);
        } finally {
            auth.clear();
            this.setToken(null);
        }
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    async verifyToken() {
        // For now, we'll mock token verification
        // In a real app, this would validate the token with the server
        if (this.token) {
            // Simulate a successful verification
            return { valid: true, message: 'Token is valid' };
        } else {
            throw new Error('No token to verify');
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Utility method to handle common API errors
    handleApiError(error, endpoint) {
        console.error(`API Error (${endpoint}):`, error);
        if (error.status === 401) {
            // Token expired or invalid, clear auth
            auth.clear();
            this.setToken(null);
            window.location.reload();
        }
        throw error;
    }

    // GitHub OAuth Endpoints
    async getGithubAuthUrl(state) {
        try {
            const response = await this.request('/github/authorize?' + new URLSearchParams({ state }).toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response || !response.url) {
                throw new Error('Invalid response from server: Missing authorization URL');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to get GitHub authorization URL:', error);
            throw new Error('Could not initialize GitHub authentication. Please try again.');
        }
    }

    async exchangeGithubCode(code, state) {
        try {
            return await this.request('/github/callback', {
                method: 'POST',
                body: JSON.stringify({ 
                    code,
                    state 
                })
            });
        } catch (error) {
            console.error('Failed to exchange GitHub code:', error);
            throw new Error('Failed to complete GitHub authentication. Please try again.');
        }
    }

    async linkGithub(token) {
        return this.request('/github/link', {
            method: 'POST',
            body: JSON.stringify({ access_token: token })
        });
    }

    async getGithubStatus() {
        return this.request('/github/me');
    }
}

// Create and export global API instance
export const apiService = new ApiService();
