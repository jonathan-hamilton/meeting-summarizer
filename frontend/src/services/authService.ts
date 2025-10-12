import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

// Only use localhost:5029 when in local development (localhost:5173), not in containers (localhost:8080)
const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5173';
const API_BASE_URL = isLocalDev ? 'http://localhost:5029/api' : '/api';

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Login failed');
      }
      throw new Error('Network error during login');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Registration failed');
      }
      throw new Error('Network error during registration');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Token refresh failed');
      }
      throw new Error('Network error during token refresh');
    }
  }

  async getProfile(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to get profile');
      }
      throw new Error('Network error while fetching profile');
    }
  }

  // Token storage methods
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // User data storage
  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getStoredUser(): any | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if token is expired (basic check)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  async changePassword(currentPassword: string, newPassword: string, accessToken: string): Promise<void> {
    try {
      console.log('🌐 Making password change request to:', `${API_BASE_URL}/auth/change-password`);
      const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('🌐 Password change response:', response.status, response.data);
    } catch (error) {
      console.error('🌐 Password change error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('🌐 Error response:', error.response.status, error.response.data);
        throw new Error(error.response.data?.error || 'Failed to change password');
      }
      throw new Error('Network error during password change');
    }
  }
}

export default AuthService;
