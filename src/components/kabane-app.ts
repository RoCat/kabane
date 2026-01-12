/**
 * Main Application Component
 *
 * Root component that orchestrates the entire application.
 * Handles authentication, data loading, and routing.
 *
 * SIMPLE SETUP:
 * 1. Clone this repo
 * 2. Edit kabane.config.json with your target repo
 * 3. Deploy to GitHub Pages
 * 4. Sign in with your GitHub Personal Access Token
 * 5. Done!
 *
 * The target repository will contain the actual configuration:
 * - .kabane/columns.yml: Kanban column definitions
 * - .kabane/ticketTypes.yml: Ticket type definitions
 * - .kabane/versions.yml: Version/sprint definitions
 * - .kabane/tickets/*.yml: Individual ticket files
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles } from '../styles';
import { authStore, signOut } from '../auth';
import {
  parseRepoFullName,
  checkKabaneFolderExists,
  loadKabaneConfig,
  initializeKabaneFolder,
  GitHubAPIError,
  loadContributors,
} from '../api';

import localConfig from '@/utils/localConfig';

// Import all components
import './kabane-login';
import './kabane-header';
import './kabane-board';
import './kabane-version-selector';
import './kabane-ticket-page';
import './kabane-ticket-form';
import { initLocalization } from '@/localization';
import { notifications } from '@/utils/notifications';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { appMobx, RouteEnum } from '@/utils/app-mobx';
import ticketManager from '@/utils/tickets';
import versionsManager from '@/utils/versions';

@localized()
@customElement('kabane-app')
export class KabaneApp extends MobxReactionUpdate(LitElement) {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--color-bg-primary);
      }

      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(13, 17, 23, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }

      .loading-content {
        text-align: center;
        color: var(--color-text-secondary);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-border-default);
        border-top-color: var(--color-accent-secondary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto var(--space-md);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .toast {
        position: fixed;
        bottom: var(--space-lg);
        right: var(--space-lg);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-md) var(--space-lg);
        color: var(--color-text-primary);
        box-shadow: var(--shadow-lg);
        z-index: 200;
        animation: slideIn 0.3s ease;
      }

      .toast.error {
        border-color: var(--color-accent-danger);
        background: rgba(218, 54, 51, 0.1);
      }

      .toast.success {
        border-color: var(--color-accent-primary);
        background: rgba(35, 134, 54, 0.1);
      }

      @keyframes slideIn {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
      }

      .config-error {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-xl);
        text-align: center;
      }

      .config-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        max-width: 600px;
      }

      .config-card h2 {
        margin: 0 0 var(--space-md);
        color: var(--color-accent-danger);
      }

      .config-card p {
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-lg);
      }

      .config-card code {
        display: block;
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
        text-align: left;
        overflow-x: auto;
        white-space: pre;
      }

      .init-prompt {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-xl);
        text-align: center;
      }

      .init-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        max-width: 500px;
      }

      .init-card h2 {
        margin: 0 0 var(--space-md);
        color: var(--color-accent-secondary);
      }

      .init-card p {
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-lg);
      }

      .init-card button {
        background: var(--color-accent-secondary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-sm) var(--space-lg);
        font-size: var(--font-size-base);
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .init-card button:hover {
        opacity: 0.9;
      }

      .init-card button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ];

  @state()
  private configError: string | null = null;

  @state()
  private needsInit = false;

  @state()
  private loading = false;

  @state()
  private loadingMessage = '';

  @state()
  private error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    initLocalization();
    this.init();

    // Listen for sign out
    window.addEventListener('kabane-signout', () => this.handleSignOut());

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('kabane-ready'));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /**
   * Initialize the application
   * Load local config file first, then check for stored authentication
   */
  private async init() {
    this.loading = true;
    this.loadingMessage = msg('Loading configuration...');

    // Try to restore authentication from localStorage
    this.loadingMessage = msg('Checking authentication...');
    await authStore.initialize();
    if (appMobx.isAuthenticated) {
      await this.loadData();
    }

    this.loading = false;
  }

  /**
   * Handle successful authentication from login component
   */
  private async handleAuthSuccess(e: CustomEvent) {
    const { accessToken } = e.detail;

    this.loading = true;
    this.loadingMessage = msg('Signing in...');

    try {
      await authStore.setAuthenticated(accessToken);
      await this.loadData();
    } catch (err) {
      notifications.showToast(err instanceof Error ? err.message : msg('Authentication failed'), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load repository data and tickets
   */
  private async loadData() {
    const token = appMobx.token;
    if (!token || !localConfig) return;

    this.loading = true;
    this.error = null;
    this.needsInit = false;

    try {
      // Step 1: Load target repository
      this.loadingMessage = msg('Loading repository...');
      const { owner, repo } = parseRepoFullName(localConfig.repository);

      // Get branch
      const branch = localConfig.defaultBranch || appMobx.repository?.default_branch;

      // Step 2: Check if .kabane folder exists
      this.loadingMessage = msg('Checking Kabane configuration...');
      const folderExists = await checkKabaneFolderExists(owner, repo, token, branch);

      if (!folderExists) {
        this.needsInit = true;
        this.loading = false;
        return;
      }

      // Step 3: Load configuration from target repository
      this.loadingMessage = msg('Loading board configuration...');
      const config = await loadKabaneConfig(owner, repo, token, branch);
      appMobx.setConfig(config);

      // Step 4: Load tickets
      this.loadingMessage = msg('Loading tickets...');
      await ticketManager.loadTickets();

      this.loadingMessage = msg('Loading versions...');
      await versionsManager.loadVersions();

      // Step 5: Load contributors
      this.loadingMessage = msg('Loading contributors...');
      const contributors = await loadContributors(owner, repo, token);
      appMobx.setContributors(contributors);

      this.loadingMessage = '';

      // Apply route after data is loaded (for F5 refresh scenarios)
      appMobx.parseRoute();
    } catch (err) {
      console.error('Failed to load data:', err);
      this.error = err instanceof Error ? err.message : msg('Failed to load data');

      if (err instanceof GitHubAPIError && err.isUnauthorized) {
        // Token invalid, sign out
        authStore.clearAuth();
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Initialize the .kabane folder in the target repository
   */
  private async handleInitialize() {
    const token = appMobx.token;
    if (!token || !localConfig) return;

    this.loading = true;
    this.loadingMessage = msg('Initializing Kabane...');

    try {
      const { owner, repo } = parseRepoFullName(localConfig.repository);
      const branch = localConfig.defaultBranch || appMobx.repository?.default_branch;

      await initializeKabaneFolder(owner, repo, token, branch);

      notifications.showToast(msg('Kabane initialized successfully!'), 'success');

      // Reload data
      await this.loadData();
    } catch (err) {
      console.error('Failed to initialize:', err);
      notifications.showToast(err instanceof Error ? err.message : msg('Failed to initialize'), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle sign out
   */
  private handleSignOut() {
    signOut();
    authStore.clearAuth();
    appMobx.setConfig(null);
    this.needsInit = false;
  }

  render() {
    // Loading overlay
    if (this.loading) {
      return html`
        <div class="loading-overlay">
          <div class="loading-content">
            <div class="spinner"></div>
            <div>${this.loadingMessage || msg('Loading...')}</div>
          </div>
        </div>
      `;
    }

    // Config error - show setup instructions
    if (this.configError) {
      return html`
        <div class="config-error">
          <div class="config-card">
            <h2>⚠️ ${msg('Configuration Error')}</h2>
            <p>${this.configError}</p>
            <p>
              <strong>${msg('Create a')} <code>kabane.config.json</code> ${msg('file')}:</strong>
            </p>
            <code
              >${JSON.stringify(
                {
                  repository: 'owner/repo',
                  defaultBranch: 'main',
                },
                null,
                2,
              )}</code
            >
          </div>
        </div>
      `;
    }

    // Not authenticated - show login
    if (!appMobx.isAuthenticated) {
      return html` <kabane-login .error=${this.error} @auth-success=${this.handleAuthSuccess}></kabane-login> `;
    }

    return html` <kabane-header @sign-out=${this.handleSignOut}></kabane-header>

      ${this.needsInit
        ? html`
            <div class="init-prompt">
              <div class="init-card">
                <h2>🎯 ${msg('Initialize Kabane')}</h2>
                <p>
                  ${msg('The repository')} <strong>${localConfig?.repository}</strong> ${msg('does not have a')}
                  <code>.kabane/</code> ${msg('folder yet')}.
                </p>
                <p>${msg('Click below to create the initial configuration with default columns and ticket types.')}</p>
                ${appMobx.canEdit
                  ? html` <button @click=${this.handleInitialize}>${msg('Initialize Kabane')}</button> `
                  : html`
                      <p style="color: var(--color-accent-danger);">
                        ⚠️ ${msg('You do not have write access to this repository.')}
                      </p>
                    `}
              </div>
            </div>
          `
        : html`
            ${appMobx.currentRoute === RouteEnum.BOARD
              ? html`
                  <div class="main">
                    <kabane-board .error=${this.error}></kabane-board>
                  </div>
                `
              : nothing}
            ${appMobx.currentRoute === RouteEnum.TICKET_DETAIL
              ? html` <kabane-ticket-page></kabane-ticket-page> `
              : nothing}
            ${appMobx.currentRoute === RouteEnum.UPDATE_TICKET || appMobx.currentRoute === RouteEnum.CREATE_TICKET
              ? html` <kabane-ticket-form></kabane-ticket-form> `
              : nothing}
          `}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-app': KabaneApp;
  }
}
