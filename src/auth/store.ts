/**
 * Authentication state management
 *
 * Provides a simple reactive auth store using the EventTarget API.
 * Token is persisted to localStorage and verified on page load.
 */

import type { AuthState, GitHubRepository, GitHubUser } from '../types';
import { checkPushAccess, fetchCurrentUser, fetchRepository, parseRepoFullName } from '../api/github';
import { getToken as getStoredToken, signOut as clearStoredToken } from './oauth';
import localConfig from '@/utils/localConfig';
import { appMobx } from '@/utils/app-mobx';

// ============================================================================
// Auth Store
// ============================================================================

class AuthStore extends EventTarget {
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
      const { repository, canEdit } = await this.checkRepositoryEditPermission(storedToken);
      appMobx.setIsAuthenticated(true);
      appMobx.setUser(user);
      appMobx.setCanEdit(canEdit);
      appMobx.setRepository(repository);
      appMobx.setToken(storedToken);
    } catch (error) {
      // Token is invalid or expired, clear it
      console.warn('Stored token is invalid, clearing...');
      clearStoredToken();
    }
  }

  private async checkRepositoryEditPermission(
    token: string,
  ): Promise<{ repository: GitHubRepository; canEdit: boolean }> {
    const { owner, repo } = parseRepoFullName(localConfig.repository);
    const repository = await fetchRepository(owner, repo, token);

    // Check push access
    const canEdit = await checkPushAccess(owner, repo, token);
    return { repository, canEdit };
  }

  /**
   * Set authentication after successful OAuth
   */
  async setAuthenticated(accessToken: string): Promise<void> {
    try {
      // Fetch user info to verify token is valid
      const user = await fetchCurrentUser(accessToken);
      const { repository, canEdit } = await this.checkRepositoryEditPermission(accessToken);
      appMobx.setIsAuthenticated(true);
      appMobx.setUser(user);
      appMobx.setCanEdit(canEdit);
      appMobx.setRepository(repository);
      appMobx.setToken(accessToken);
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
    appMobx.setIsAuthenticated(false);
    appMobx.setUser(null);
    appMobx.setToken(null);
    appMobx.setCanEdit(false);
    appMobx.setRepository(null);

    // Also clear from localStorage
    clearStoredToken();
  }
}

// Singleton instance
export const authStore = new AuthStore();

// Re-export types
export type { AuthState, GitHubUser };
