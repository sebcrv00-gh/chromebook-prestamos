const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  static getAuthHeader() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...ApiClient.getAuthHeader(),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If 401, handle token expiration/logout
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Error en la solicitud');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static get(endpoint) {
    return ApiClient.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return ApiClient.request(endpoint, { method: 'POST', body });
  }

  static put(endpoint, body) {
    return ApiClient.request(endpoint, { method: 'PUT', body });
  }

  static patch(endpoint, body) {
    return ApiClient.request(endpoint, { method: 'PATCH', body });
  }

  static delete(endpoint) {
    return ApiClient.request(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;
