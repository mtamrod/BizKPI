import { apiClient } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  business_name: string;
  business_sector: string | null;
  created_at: string | null;
}

export interface UpdateProfileInput {
  business_name?: string;
  business_sector?: string;
}

export const userService = {
  /**
   * Fetches the profile of the currently authenticated user.
   * Returns null if the profile doesn't exist yet (new user).
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      return await apiClient.get<UserProfile>('/users/me');
    } catch {
      return null;
    }
  },

  /**
   * Updates editable fields of the user profile.
   */
  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/users/me', input);
  },
};
