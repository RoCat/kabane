/**
 * Authentication state management
 *
 * Provides a simple reactive auth store using the EventTarget API.
 * Token is persisted to localStorage and verified on page load.
 */

import type { AuthState, GitHubUser } from '../types';
import { fetchCurrentUser } from '../api/github';
import { getToken as getStoredToken, signOut as clearStoredToken } from './oauth';

// ============================================================================
// Auth Store
// ============================================================================

type AuthStateListener = (state: AuthState) => void;

class AuthStore extends EventTarget {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
  };

  private listeners: Set<AuthStateListener> = new Set();
  private initialized = false;

  /**
   * Initialize the store by checking for a stored token
   * Should be called once on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const storedToken = getStoredToken();
    if (!storedToken) return;

    try {
      // Verify the token is still valid
      const user = await fetchCurrentUser(storedToken);

      this.state = {
        isAuthenticated: true,
        user,
        accessToken: storedToken,
      };

      this.notifyListeners();
      this.dispatchEvent(new CustomEvent('auth-change', { detail: this.state }));
    } catch (error) {
      // Token is invalid or expired, clear it
      console.warn('Stored token is invalid, clearing...');
      clearStoredToken();
    }
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get access token (if authenticated)
   */
  getToken(): string | null {
    return this.state.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.state.accessToken !== null;
  }

  /**
   * Set authentication after successful OAuth
   */
  async setAuthenticated(accessToken: string): Promise<void> {
    try {
      // Fetch user info to verify token is valid
      const user = await fetchCurrentUser(accessToken);

      this.state = {
        isAuthenticated: true,
        user,
        accessToken,
      };

      this.notifyListeners();
      this.dispatchEvent(new CustomEvent('auth-change', { detail: this.state }));
    } catch (error) {
      // Token is invalid, clear state
      this.clearAuth();
      throw error;
    }
  }

  /**
   * Clear authentication state (sign out)
   */
  clearAuth(): void {
    this.state = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
    };

    // Also clear from localStorage
    clearStoredToken();

    this.notifyListeners();
    this.dispatchEvent(new CustomEvent('auth-change', { detail: this.state }));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// Singleton instance
export const authStore = new AuthStore();

// Re-export types
export type { AuthState, GitHubUser };
