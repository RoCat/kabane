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

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles } from '../styles';
import { authStore, signOut } from '../auth';
import {
  fetchRepository,
  parseRepoFullName,
  checkPushAccess,
  checkKabaneFolderExists,
  loadKabaneConfig,
  loadTickets,
  initializeKabaneFolder,
  updateTicket,
  createTicket,
  createVersion,
  updateVersion,
  generateVersionId,
  GitHubAPIError,
  loadContributors,
} from '../api';
import type { Ticket, KabaneConfig, LocalConfig, GitHubRepository, GitHubUser } from '../types';

// Import all components
import './kabane-login';
import './kabane-header';
import './kabane-board';
import './kabane-version-selector';
import './kabane-ticket-page';
import './kabane-ticket-form';
import { initLocalization } from '@/localization';

@localized()
@customElement('kabane-app')
export class KabaneApp extends LitElement {
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
  private isAuthenticated = false;

  @state()
  private user: GitHubUser | null = null;

  @state()
  private repository: GitHubRepository | null = null;

  @state()
  private localConfig: LocalConfig | null = null;

  @state()
  private config: KabaneConfig | null = null;

  @state()
  private configError: string | null = null;

  @state()
  private needsInit = false;

  @state()
  private tickets: Ticket[] = [];

  @state()
  private contributors: GitHubUser[] = [];

  @state()
  private canEdit = false;

  @state()
  private loading = false;

  @state()
  private loadingMessage = '';

  @state()
  private error: string | null = null;

  @state()
  private toast: { message: string; type: 'success' | 'error' } | null = null;

  @state()
  private selectedTicket: Ticket | null = null;

  @state()
  private saving = false;

  @state()
  private selectedVersionId: string | null = null;

  // View states: 'board' | 'ticket-detail' | 'ticket-form'
  @state()
  private currentView: 'board' | 'ticket-detail' | 'ticket-form' = 'board';

  @state()
  private isCreatingTicket = false;

  // Bound handler for popstate event
  private boundHandlePopState = this.handlePopState.bind(this);

  connectedCallback() {
    super.connectedCallback();
    initLocalization();
    this.init();
    // Listen for auth changes
    authStore.subscribe(state => {
      this.isAuthenticated = state.isAuthenticated;
      this.user = state.user;
    });

    // Listen for sign out
    window.addEventListener('kabane-signout', () => this.handleSignOut());

    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', this.boundHandlePopState);

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('kabane-ready'));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.boundHandlePopState);
  }

  /**
   * Parse the current URL hash and return route info
   */
  private parseRoute(): { view: 'board' | 'ticket-detail' | 'ticket-form'; ticketId?: string; isCreating?: boolean } {
    const hash = window.location.hash.slice(1); // Remove the #

    if (!hash || hash === '/') {
      return { view: 'board' };
    }

    // /ticket/:id -> ticket detail view
    const ticketMatch = hash.match(/^\/ticket\/(.+)$/);
    if (ticketMatch) {
      return { view: 'ticket-detail', ticketId: ticketMatch[1] };
    }

    // /create-ticket -> create ticket form
    if (hash === '/create-ticket') {
      return { view: 'ticket-form', isCreating: true };
    }

    // /update-ticket/:id -> edit ticket form
    const updateMatch = hash.match(/^\/update-ticket\/(.+)$/);
    if (updateMatch) {
      return { view: 'ticket-form', ticketId: updateMatch[1], isCreating: false };
    }

    return { view: 'board' };
  }

  /**
   * Navigate to a route and update URL
   */
  private navigateTo(path: string, replace = false) {
    const newUrl = `${window.location.pathname}${window.location.search}#${path}`;
    if (replace) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
    this.applyRoute();
  }

  /**
   * Apply the current route to the component state
   */
  private applyRoute() {
    const route = this.parseRoute();

    this.currentView = route.view;
    this.isCreatingTicket = route.isCreating || false;

    if (route.ticketId) {
      const ticket = this.tickets.find(t => t.id === route.ticketId);
      if (ticket) {
        this.selectedTicket = ticket;
      } else if (this.tickets.length > 0) {
        // Ticket not found, go back to board
        this.navigateTo('/', true);
        return;
      }
      // If tickets not loaded yet, selectedTicket will be set after loadData
    } else {
      this.selectedTicket = null;
    }
  }

  /**
   * Handle browser back/forward navigation
   */
  private handlePopState() {
    this.applyRoute();
  }

  /**
   * Apply route after data is loaded (for F5 refresh scenarios)
   */
  private applyRouteAfterDataLoad() {
    const route = this.parseRoute();

    if (route.ticketId) {
      const ticket = this.tickets.find(t => t.id === route.ticketId);
      if (ticket) {
        this.selectedTicket = ticket;
        this.currentView = route.view;
        this.isCreatingTicket = route.isCreating || false;
      } else {
        // Ticket not found, redirect to board
        this.navigateTo('/', true);
      }
    }
  }

  /**
   * Initialize the application
   * Load local config file first, then check for stored authentication
   */
  private async init() {
    this.loading = true;
    this.loadingMessage = msg('Loading configuration...');

    try {
      // Load config from local file (just contains repository name)
      this.localConfig = await this.loadLocalConfig();

      // Try to restore authentication from localStorage
      this.loadingMessage = msg('Checking authentication...');
      await authStore.initialize();
      if (this.isAuthenticated) {
        await this.loadData();
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      this.configError = err instanceof Error ? err.message : msg('Failed to load configuration');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load kabane.config.json from the same directory as the app
   */
  private async loadLocalConfig(): Promise<LocalConfig> {
    const response = await fetch('./kabane.config.json');

    if (!response.ok) {
      throw new Error('kabane.config.json not found. ' + 'Please create this file in the root of your deployment.');
    }

    const config = await response.json();

    // Validate required fields
    if (!config.repository) {
      throw new Error('Missing "repository" in kabane.config.json');
    }

    return {
      repository: config.repository,
      defaultBranch: config.defaultBranch,
    };
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
      this.showToast(err instanceof Error ? err.message : msg('Authentication failed'), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load repository data and tickets
   */
  private async loadData() {
    const token = authStore.getToken();
    if (!token || !this.localConfig) return;

    this.loading = true;
    this.error = null;
    this.needsInit = false;

    try {
      // Step 1: Load target repository
      this.loadingMessage = msg('Loading repository...');
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      this.repository = await fetchRepository(owner, repo, token);

      // Check push access
      this.canEdit = await checkPushAccess(owner, repo, token);

      // Get branch
      const branch = this.localConfig.defaultBranch || this.repository.default_branch;

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
      this.config = await loadKabaneConfig(owner, repo, token, branch);

      // Step 4: Load tickets
      this.loadingMessage = msg('Loading tickets...');
      this.tickets = await loadTickets(owner, repo, token, branch);

      // Step 5: Load contributors
      this.loadingMessage = msg('Loading contributors...');
      this.contributors = await loadContributors(owner, repo, token);

      this.loadingMessage = '';

      // Apply route after data is loaded (for F5 refresh scenarios)
      this.applyRouteAfterDataLoad();
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
    const token = authStore.getToken();
    if (!token || !this.localConfig) return;

    this.loading = true;
    this.loadingMessage = msg('Initializing Kabane...');

    try {
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      const branch = this.localConfig.defaultBranch || this.repository?.default_branch;

      await initializeKabaneFolder(owner, repo, token, branch);

      this.showToast(msg('Kabane initialized successfully!'), 'success');

      // Reload data
      await this.loadData();
    } catch (err) {
      console.error('Failed to initialize:', err);
      this.showToast(err instanceof Error ? err.message : msg('Failed to initialize'), 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle ticket update (from drag-drop or form)
   */
  private async handleTicketUpdate(e: CustomEvent) {
    const { ticket, changes } = e.detail;

    if (!this.canEdit) {
      this.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = authStore.getToken();
    if (!token || !this.localConfig) return;

    this.saving = true;

    try {
      // Create updated ticket
      const updatedTicket: Ticket = {
        ...ticket,
        ...changes,
      };

      // Commit to GitHub
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      const branch = this.localConfig.defaultBranch || this.repository?.default_branch;

      const result = await updateTicket(owner, repo, updatedTicket, token, branch);

      this.tickets = this.tickets.map(t => (t.id === ticket.id ? result : t));

      this.showToast(msg('Ticket updated successfully'), 'success');

      // Go back to board if we were editing
      if (this.currentView === 'ticket-form') {
        this.navigateTo('/');
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);

      if (err instanceof GitHubAPIError && err.isConflict) {
        this.showToast(msg('Conflict: The file has been modified. Please refresh.'), 'error');
      } else {
        this.showToast(err instanceof Error ? err.message : msg('Failed to update ticket'), 'error');
      }
    } finally {
      this.saving = false;
    }
  }

  /**
   * Handle ticket click to view details (read-only page)
   */
  private handleTicketClick(e: CustomEvent) {
    const ticket = e.detail.ticket;
    this.navigateTo(`/ticket/${ticket.id}`);
  }

  /**
   * Handle ticket edit request (from card or detail page)
   */
  private handleTicketEdit(e: CustomEvent) {
    const ticket = e.detail.ticket;
    this.navigateTo(`/update-ticket/${ticket.id}`);
  }

  /**
   * Handle back navigation
   */
  private handleBack() {
    this.navigateTo('/');
  }

  /**
   * Handle creating a new ticket
   */
  private handleNewTicket() {
    this.navigateTo('/create-ticket');
  }

  /**
   * Handle ticket creation form submit
   */
  private async handleTicketCreate(e: CustomEvent) {
    const { ticket } = e.detail;

    if (!this.canEdit) {
      this.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = authStore.getToken();
    if (!token || !this.localConfig) return;

    this.saving = true;

    try {
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      const branch = this.localConfig.defaultBranch || this.repository?.default_branch;

      const newTicket = await createTicket(owner, repo, ticket, token, branch);

      this.tickets = [...this.tickets, newTicket];
      this.showToast(msg('Ticket created successfully'), 'success');

      // Go back to board
      this.navigateTo('/');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      this.showToast(err instanceof Error ? err.message : msg('Failed to create ticket'), 'error');
    } finally {
      this.saving = false;
    }
  }

  /**
   * Handle version selection change
   */
  private handleVersionChange(e: CustomEvent) {
    this.selectedVersionId = e.detail.versionId;
  }

  /**
   * Handle creating a new version
   */
  private async handleVersionCreate(e: CustomEvent) {
    const { version } = e.detail;

    if (!this.canEdit) {
      this.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = authStore.getToken();
    if (!token || !this.localConfig || !this.config) return;

    this.saving = true;

    try {
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      const branch = this.localConfig.defaultBranch || this.repository?.default_branch;

      // Generate version ID
      const versionWithId = {
        ...version,
        id: generateVersionId(),
      };

      const updatedVersions = await createVersion(owner, repo, versionWithId, this.config.versions, token, branch);

      // Update config with new versions
      this.config = {
        ...this.config,
        versions: updatedVersions,
      };

      // Auto-select the new version
      this.selectedVersionId = versionWithId.id;

      this.showToast(msg('Version created successfully'), 'success');
    } catch (err) {
      console.error('Failed to create version:', err);
      this.showToast(err instanceof Error ? err.message : msg('Failed to create version'), 'error');
    } finally {
      this.saving = false;
    }
  }

  /**
   * Handle updating an existing version
   */
  private async handleVersionUpdate(e: CustomEvent) {
    const { version } = e.detail;

    if (!this.canEdit) {
      this.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = authStore.getToken();
    if (!token || !this.localConfig || !this.config) return;

    this.saving = true;

    try {
      const { owner, repo } = parseRepoFullName(this.localConfig.repository);
      const branch = this.localConfig.defaultBranch || this.repository?.default_branch;

      const updatedVersions = await updateVersion(owner, repo, version, this.config.versions, token, branch);

      // Update config with updated versions
      this.config = {
        ...this.config,
        versions: updatedVersions,
      };

      this.showToast(msg('Version updated successfully'), 'success');
    } catch (err) {
      console.error('Failed to update version:', err);
      this.showToast(err instanceof Error ? err.message : msg('Failed to update version'), 'error');
    } finally {
      this.saving = false;
    }
  }

  /**
   * Handle sign out
   */
  private handleSignOut() {
    signOut();
    authStore.clearAuth();
    this.repository = null;
    this.tickets = [];
    this.config = null;
    this.canEdit = false;
    this.needsInit = false;
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
    }, 5000);
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
    if (!this.isAuthenticated) {
      return html` <kabane-login .error=${this.error} @auth-success=${this.handleAuthSuccess}></kabane-login> `;
    }

    // Need to initialize .kabane folder
    if (this.needsInit) {
      return html`
        <kabane-header
          .user=${this.user}
          .repository=${this.repository}
          .canEdit=${this.canEdit}
          @sign-out=${this.handleSignOut}
        ></kabane-header>

        <div class="init-prompt">
          <div class="init-card">
            <h2>🎯 ${msg('Initialize Kabane')}</h2>
            <p>
              ${msg('The repository')} <strong>${this.localConfig?.repository}</strong> ${msg('does not have a')}
              <code>.kabane/</code> ${msg('folder yet')}.
            </p>
            <p>${msg('Click below to create the initial configuration with default columns and ticket types.')}</p>
            ${this.canEdit
              ? html` <button @click=${this.handleInitialize}>${msg('Initialize Kabane')}</button> `
              : html`
                  <p style="color: var(--color-accent-danger);">
                    ⚠️ ${msg('You do not have write access to this repository.')}
                  </p>
                `}
          </div>
        </div>

        ${this.toast ? html` <div class="toast ${this.toast.type}">${this.toast.message}</div> ` : ''}
      `;
    }

    // Main app view
    return html`
      <kabane-header
        .user=${this.user}
        .repository=${this.repository}
        .canEdit=${this.canEdit}
        @sign-out=${this.handleSignOut}
      ></kabane-header>

      ${this.currentView === 'board'
        ? html`
            <div class="main">
              <kabane-board
                .tickets=${this.tickets}
                .config=${this.config}
                .selectedVersionId=${this.selectedVersionId}
                ?readonly=${!this.canEdit}
                .error=${this.error}
                @ticket-update=${this.handleTicketUpdate}
                @ticket-click=${this.handleTicketClick}
                @ticket-edit=${this.handleTicketEdit}
                @version-change=${this.handleVersionChange}
                @version-create=${this.handleVersionCreate}
                @version-update=${this.handleVersionUpdate}
                @ticket-create=${this.handleNewTicket}
              ></kabane-board>
            </div>
          `
        : ''}
      ${this.currentView === 'ticket-detail' && this.selectedTicket
        ? html`
            <kabane-ticket-page
              .ticket=${this.selectedTicket}
              .allTickets=${this.tickets}
              .config=${this.config}
              .repository=${this.repository}
              ?readonly=${!this.canEdit}
              @back=${this.handleBack}
              @edit-ticket=${this.handleTicketEdit}
              @view-ticket=${this.handleTicketClick}
            ></kabane-ticket-page>
          `
        : ''}
      ${this.currentView === 'ticket-form'
        ? html`
            <kabane-ticket-form
              .ticket=${this.isCreatingTicket ? null : this.selectedTicket}
              .config=${this.config}
              .allTickets=${this.tickets}
              .contributors=${this.contributors}
              .repository=${this.repository}
              .token=${authStore.getToken() || ''}
              .selectedVersionId=${this.selectedVersionId}
              ?saving=${this.saving}
              @cancel=${this.handleBack}
              @save=${this.handleTicketUpdate}
              @create=${this.handleTicketCreate}
            ></kabane-ticket-form>
          `
        : ''}
      ${this.toast ? html` <div class="toast ${this.toast.type}">${this.toast.message}</div> ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-app': KabaneApp;
  }
}
