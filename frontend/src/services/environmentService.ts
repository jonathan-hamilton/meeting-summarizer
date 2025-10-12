import axios from 'axios';

// Use relative URL when not on localhost (i.e., in deployed container)
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5029/api' : '/api';

export interface EnvironmentFeatures {
  [key: string]: boolean;
}

// Define separate interfaces for different response structures
export interface EnvironmentInfo {
  Environment: string;
  Features: EnvironmentFeatures;
  SystemFeatures: {
    SwaggerEnabled: boolean;
    DetailedErrors: boolean;
    SensitiveDataLogging: boolean;
    TestEndpoints: boolean;
  };
}

class EnvironmentService {
  private static instance: EnvironmentService;
  private featuresCache: any = null; // Use any to handle actual API response structure
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  async getFeatures(): Promise<any> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.featuresCache && this.cacheExpiry > now) {
      return this.featuresCache;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/environment/features`);
      this.featuresCache = response.data;
      this.cacheExpiry = now + this.CACHE_DURATION;
      return this.featuresCache;
    } catch (error) {
      console.warn('Failed to fetch environment features, using defaults:', error);
      // Return default values matching API structure
      const defaultFeatures = {
        environment: 'Unknown',
        features: {
          RequireInvitationForRegistration: false
        },
        systemFeatures: {
          swaggerEnabled: false,
          detailedErrors: false,
          sensitiveDataLogging: false,
          testEndpoints: false
        }
      };
      return defaultFeatures;
    }
  }

  async requiresInvitationForRegistration(): Promise<boolean> {
    const features = await this.getFeatures();
    console.log('🔍 Environment features:', features);
    // API returns features nested under features.RequireInvitationForRegistration
    const result = features?.features?.RequireInvitationForRegistration === true;
    console.log('🔍 Requires invitation for registration:', result);
    return result;
  }
}

export const environmentService = EnvironmentService.getInstance();