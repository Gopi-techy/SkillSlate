// API Service for SkillSlate Backend
import { auth } from './auth.js';

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = auth.getToken();
    }

    // Set authentication token
    setToken(token) { this.token = token; }

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
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
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
        return this.request('/auth/verify');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create and export global API instance
export const apiService = new ApiService();
