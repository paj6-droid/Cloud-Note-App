// API client for making requests to the backend
const API_BASE_URL = window.location.origin;

class API {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If token is invalid, remove it
        if (response.status === 401) {
          this.removeToken();
          if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(username, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Note methods
  async getNotes(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.color) queryParams.append('color', filters.color);
    if (filters.archived !== undefined) queryParams.append('archived', filters.archived);
    if (filters.pinned !== undefined) queryParams.append('pinned', filters.pinned);
    
    const query = queryParams.toString();
    return this.request(`/api/notes${query ? '?' + query : ''}`);
  }

  async getNote(id) {
    return this.request(`/api/notes/${id}`);
  }

  async createNote(title, content, color_tag) {
    return this.request('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, color_tag })
    });
  }

  async updateNote(id, updates) {
    return this.request(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteNote(id) {
    return this.request(`/api/notes/${id}`, {
      method: 'DELETE'
    });
  }

  async searchNotes(query) {
    return this.request(`/api/notes/search?q=${encodeURIComponent(query)}`);
  }

  async summarizeNote(id) {
    return this.request(`/api/ai/notes/${id}/summarize`, {
      method: 'POST'
    });
  }
}

// Export singleton instance
const api = new API();
window.api = api; // Make available globally

