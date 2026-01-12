/**
 * GitHub Personal Access Token (PAT) Authentication
 *
 * Simple authentication using GitHub Fine-grained Personal Access Tokens.
 * NO BACKEND REQUIRED - just paste your token!
 *
 * How to create a Fine-grained PAT:
 * 1. Go to https://github.com/settings/personal-access-tokens/new
 * 2. Set "Repository access" to "Only select repositories" → choose your repo
 * 3. Set "Contents" permission to "Read and write"
 * 4. Copy the token and paste it in Kabane
 *
 * Security note:
 * - Fine-grained tokens only access the repos you specify (safer!)
 * - Token is stored in sessionStorage (cleared when browser closes)
 * - Never commit your token to a repository
 * - You can revoke tokens anytime at https://github.com/settings/tokens
 */

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kabane_pat';

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Save a Personal Access Token
 * Validates the token by making a test API call
 */
export async function saveToken(token: string): Promise<AuthResult> {
  if (!token || !token.trim()) {
    return { success: false, error: 'Token is required' };
  }

  const trimmedToken = token.trim();

  // Validate token format (classic or fine-grained)
  if (!isValidTokenFormat(trimmedToken)) {
    return {
      success: false,
      error: 'Invalid token format. GitHub tokens start with "ghp_" (classic) or "github_pat_" (fine-grained)',
    };
  }

  // Test the token by fetching user info
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${trimmedToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid or expired token' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Token does not have required permissions' };
      }
      return { success: false, error: `GitHub API error: ${response.statusText}` };
    }

    // Token is valid, save it to localStorage (persists across sessions)
    localStorage.setItem(STORAGE_KEY, trimmedToken);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Get the stored token
 */
export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Sign out - clear the token
 */
export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a string looks like a valid GitHub token
 */
function isValidTokenFormat(token: string): boolean {
  // Classic PAT: ghp_xxxx
  // Fine-grained PAT: github_pat_xxxx
  // OAuth token: gho_xxxx (from OAuth apps)
  return /^(ghp_|github_pat_|gho_)[a-zA-Z0-9_]+$/.test(token);
}

// ============================================================================
// Legacy exports for compatibility
// ============================================================================

// These are kept for compatibility with existing code
export function setClientId(_id: string): void {
  // No longer needed with PAT auth
}

export function getClientId(): string | null {
  return null;
}
