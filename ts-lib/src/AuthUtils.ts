import { Store } from './Store';
import { jwtDecode } from 'jwt-decode';

/**
 * Utility functions for authentication
 */
export const AuthUtils = {
    /**
     * Gets the JWT token from localStorage
     * @returns The JWT token or null if not found
     */
    getToken(): string | null {
        return Store.get('jwt_token');
    },

    /**
     * Gets the user ID from localStorage
     * @returns The user ID or null if not found
     */
    getUserId(): string | null {
        return Store.get('user_id');
    },

    /**
     * Checks if the user is logged in by verifying if a JWT token exists
     * @returns True if logged in, false otherwise
     */
    isLoggedIn(): boolean {
        const token = this.getToken();
        return !!token;
    },

    /**
     * Logs out the user by removing the JWT token and user ID from localStorage
     */
    logout(): void {
        Store.remove('jwt_token');
        Store.remove('user_id');
    },

    /**
     * Extracts the user ID from a JWT token following the same logic as JwtHelper.cs
     * @param token - The JWT token
     * @returns The user ID extracted from the token or empty string on error
     */
    extractUidFromToken(token: string): string {
        try {
            const decoded: any = jwtDecode(token);
            // Match the C# implementation which looks for user.uid
            if (decoded.user && decoded.user.uid) {
                return decoded.user.uid.toString();
            }
            // Fallback to other common claims
            return decoded.uid || decoded.sub || '';
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return '';
        }
    },


};
