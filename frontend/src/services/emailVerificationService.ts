import axios from 'axios';
import apiService from './apiService';

export interface EmailVerificationStatus {
  success: boolean;
  emailVerified: boolean;
  hasActiveToken: boolean;
  tokenExpiry?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  error?: string;
}

class EmailVerificationService {
  private static instance: EmailVerificationService;

  public static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  /**
   * Get the current email verification status for the authenticated user
   */
  async getVerificationStatus(token: string): Promise<EmailVerificationStatus> {
    try {
      // Use apiService for consistent URL handling
      const response = await apiService.get('/api/emailverification/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data as EmailVerificationStatus;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to get verification status');
      }
      throw new Error('Network error while checking verification status');
    }
  }

  /**
   * Resend verification email to the authenticated user
   */
  async resendVerificationEmail(token: string): Promise<VerificationResponse> {
    try {
      console.group('🔍 [EmailVerificationService] Resending verification email');
      console.log('🎯 Full URL: Using apiService for /api/emailverification/resend');
      console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'NONE');
      console.log('📋 Headers:', { 'Authorization': `Bearer ${token}` });
      console.groupEnd();
      
      // Use apiService for consistent URL handling
      const response = await apiService.post('/api/emailverification/resend', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ [EmailVerificationService] Resend email successful:', response.data);
      return response.data as VerificationResponse;
    } catch (error) {
      console.error('❌ [EmailVerificationService] Resend email failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('❌ [EmailVerificationService] Response details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });
        // Handle rate limiting specifically
        if (error.response.status === 429) {
          throw new Error('Too many verification email requests. Please wait before requesting another.');
        }
        throw new Error(error.response.data?.message || 'Failed to send verification email');
      }
      throw new Error('Network error while sending verification email');
    }
  }

  /**
   * Verify email address using verification token (from email link)
   */
  async verifyEmail(token: string): Promise<VerificationResponse> {
    try {
      const response = await apiService.post(`/api/emailverification/verify/${token}`);
      return response.data as VerificationResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Email verification failed');
      }
      throw new Error('Network error during email verification');
    }
  }

  /**
   * Invalidate the current verification token
   */
  async invalidateToken(token: string): Promise<VerificationResponse> {
    try {
      const response = await apiService.delete('/api/emailverification/token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data as VerificationResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to invalidate token');
      }
      throw new Error('Network error while invalidating token');
    }
  }
}

export default EmailVerificationService;