import type { UserProfile, UpdateUserRequest, UserStats } from '../stores/userProfileStore';
import realApiService from './apiService';

class UserProfileService {
  // For now, use the real API service directly
  // In production, this should be mode-aware
  private apiService = realApiService;

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await this.apiService.get(`/api/usermanagement/${userId}`);
      return this.mapApiResponseToProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Get user profile by email
   */
  async getUserProfileByEmail(email: string): Promise<UserProfile> {
    try {
      const response = await this.apiService.get(`/api/usermanagement/email/${encodeURIComponent(email)}`);
      return this.mapApiResponseToProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile by email:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    try {
      const response = await this.apiService.put(`/api/usermanagement/${userId}`, updates);
      return this.mapApiResponseToProfile(response.data);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await this.apiService.get(`/api/usermanagement/${userId}/stats`);
      return response.data as UserStats;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      throw new Error('Failed to load user statistics');
    }
  }

  /**
   * Delete user account (GDPR compliance)
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      await this.apiService.delete(`/api/usermanagement/${userId}`);
    } catch (error) {
      console.error('Failed to delete user account:', error);
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Create a new user account
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    isPaidUser?: boolean;
    initialTokenBalance?: number;
    hasConsentedToDataProcessing: boolean;
  }): Promise<UserProfile> {
    try {
      const response = await this.apiService.post('/api/usermanagement/register', userData);
      return this.mapApiResponseToProfile(response.data);
    } catch (error) {
      console.error('Failed to create user account:', error);
      throw new Error('Failed to create account');
    }
  }

  /**
   * Map API response to UserProfile interface
   */
  private mapApiResponseToProfile(apiData: any): UserProfile {
    return {
      id: apiData.userId || apiData.id,
      email: apiData.email,
      firstName: apiData.firstName,
      lastName: apiData.lastName,
      isPaidUser: apiData.isPaidUser || false,
      tokenBalance: apiData.tokenBalance || 0,
      createdAt: apiData.createdAt || apiData.accountCreatedAt,
      lastActivityAt: apiData.lastActivityAt,
    };
  }
}

// Create singleton instance
export const userProfileService = new UserProfileService();
