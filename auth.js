// Authentication state management
class AuthManager {
  constructor() {
    this.token = api.getToken();
    this.user = null;
    this.checkAuth();
  }

  // Check if user is authenticated
  checkAuth() {
    if (this.token) {
      // Decode token to get user info (basic implementation)
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        this.logout();
      }
    }
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.login(email, password);
      if (response.success) {
        api.setToken(response.token);
        this.token = response.token;
        this.user = response.user;
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }

  // Register user
  async register(username, email, password) {
    try {
      const response = await api.register(username, email, password);
      if (response.success) {
        api.setToken(response.token);
        this.token = response.token;
        this.user = response.user;
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  }

  // Logout user
  logout() {
    api.removeToken();
    this.token = null;
    this.user = null;
    window.location.href = '/';
  }

  // Require authentication - redirect if not logged in
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/';
      return false;
    }
    return true;
  }
}

// Export singleton instance
const authManager = new AuthManager();
window.authManager = authManager; // Make available globally

