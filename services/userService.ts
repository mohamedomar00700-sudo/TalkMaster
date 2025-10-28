import { UserProfile } from '../types';

const USER_PROFILE_KEY = 'talkmaster_user_profile';

class UserService {
    public getUserProfile(): UserProfile | null {
        try {
            const profileJson = localStorage.getItem(USER_PROFILE_KEY);
            if (!profileJson) return null;

            const profile = JSON.parse(profileJson);
            // For existing users, add a default avatarId if it's missing.
            if (!profile.avatarId) {
                profile.avatarId = 'orion';
            }
            return profile;
        } catch (error) {
            console.error('Error parsing user profile from localStorage:', error);
            // In case of parsing error, clear the corrupted data
            localStorage.removeItem(USER_PROFILE_KEY);
            return null;
        }
    }

    public saveUserProfile(profile: UserProfile): void {
        try {
            const profileJson = JSON.stringify(profile);
            localStorage.setItem(USER_PROFILE_KEY, profileJson);
        } catch (error) {
            console.error('Error saving user profile to localStorage:', error);
        }
    }
}

export const userService = new UserService();