import axios from 'axios';

const API_BASE_URL = 'http://localhost:5029/api';

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
      const response = await axios.get(`${API_BASE_URL}/emailverification/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
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
      const response = await axios.post(`${API_BASE_URL}/emailverification/resend`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
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
      const response = await axios.post(`${API_BASE_URL}/emailverification/verify/${token}`);
      return response.data;
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
      const response = await axios.delete(`${API_BASE_URL}/emailverification/token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to invalidate token');
      }
      throw new Error('Network error while invalidating token');
    }
  }
}

export default EmailVerificationService;