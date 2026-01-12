/**
 * Login View Component
 *
 * Displays the sign-in page with Personal Access Token input.
 * Simple and secure - no OAuth complexity!
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles, buttonStyles } from '../styles';
import { saveToken } from '../auth';

@localized()
@customElement('kabane-login')
export class KabaneLogin extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    buttonStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--color-bg-primary);
        padding: var(--space-lg);
      }

      .login-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        max-width: 480px;
        width: 100%;
      }

      .header {
        text-align: center;
        margin-bottom: var(--space-xl);
      }

      .logo {
        font-size: 48px;
        margin-bottom: var(--space-md);
      }

      h1 {
        font-size: var(--font-size-xl);
        font-weight: 600;
        margin: 0 0 var(--space-sm);
      }

      .subtitle {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        margin: 0;
      }

      .form-group {
        margin-bottom: var(--space-lg);
      }

      label {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: 500;
        margin-bottom: var(--space-sm);
        color: var(--color-text-primary);
      }

      .token-input {
        width: 100%;
        padding: var(--space-md);
        font-size: var(--font-size-md);
        font-family: var(--font-mono);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        box-sizing: border-box;
      }

      .token-input:focus {
        outline: none;
        border-color: var(--color-accent-secondary);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
      }

      .token-input::placeholder {
        color: var(--color-text-muted);
      }

      .submit-btn {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        font-size: var(--font-size-md);
        font-weight: 500;
        background: var(--color-accent-primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .submit-btn:hover:not(:disabled) {
        background: #2ea043;
      }

      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .error-message {
        background: rgba(218, 54, 51, 0.1);
        border: 1px solid var(--color-accent-danger);
        border-radius: var(--radius-md);
        color: var(--color-accent-danger);
        padding: var(--space-md);
        margin-bottom: var(--space-lg);
        font-size: var(--font-size-sm);
      }

      .help-section {
        margin-top: var(--space-xl);
        padding-top: var(--space-lg);
        border-top: 1px solid var(--color-border-default);
      }

      .help-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 var(--space-md);
      }

      .help-steps {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .help-steps li {
        padding: var(--space-xs) 0;
        padding-left: var(--space-lg);
        position: relative;
      }

      .help-steps li::before {
        content: attr(data-step);
        position: absolute;
        left: 0;
        color: var(--color-accent-secondary);
        font-weight: 600;
      }

      .help-steps a {
        color: var(--color-text-link);
        text-decoration: none;
      }

      .help-steps a:hover {
        text-decoration: underline;
      }

      .scopes-note {
        margin-top: var(--space-md);
        padding: var(--space-sm) var(--space-md);
        background: var(--color-bg-primary);
        border-radius: var(--radius-md);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .scopes-note code {
        background: rgba(110, 118, 129, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: var(--font-mono);
      }

      .security-note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        margin-top: var(--space-lg);
        padding: var(--space-md);
        background: rgba(35, 134, 54, 0.1);
        border-radius: var(--radius-md);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .security-note svg {
        flex-shrink: 0;
        color: var(--color-accent-primary);
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ];

  @property({ type: String })
  error: string | null = null;

  @state()
  private tokenValue = '';

  @state()
  private loading = false;

  @state()
  private localError: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('locale-changed', this.handleLocaleChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('locale-changed', this.handleLocaleChange);
  }

  private handleLocaleChange = () => {
    this.requestUpdate();
  };

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.tokenValue = input.value;
    this.localError = null;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    if (!this.tokenValue.trim()) {
      this.localError = msg('Please enter your Personal Access Token');
      return;
    }

    this.loading = true;
    this.localError = null;

    try {
      const result = await saveToken(this.tokenValue);

      if (result.success) {
        // Dispatch success event
        this.dispatchEvent(
          new CustomEvent('auth-success', {
            detail: { accessToken: this.tokenValue.trim() },
            bubbles: true,
            composed: true,
          }),
        );
      } else {
        this.localError = result.error || msg('Failed to validate token');
      }
    } catch (err) {
      this.localError = err instanceof Error ? err.message : msg('An error occurred');
    } finally {
      this.loading = false;
    }
  }

  render() {
    const displayError = this.localError || this.error;

    return html`
      <div class="login-card">
        <div class="header">
          <div class="logo">📋</div>
          <h1>Kabane</h1>
          <p class="subtitle">${msg('A beautiful Kanban board powered by GitHub')}</p>
        </div>

        ${displayError ? html` <div class="error-message">${displayError}</div> ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="token">${msg('Sign in with Personal Access Token')}</label>
            <input
              type="password"
              id="token"
              class="token-input"
              placeholder="github_pat_xxxxxxxxxxxx"
              .value=${this.tokenValue}
              @input=${this.handleInput}
              ?disabled=${this.loading}
              autocomplete="off"
            />
          </div>

          <button type="submit" class="submit-btn" ?disabled=${this.loading || !this.tokenValue.trim()}>
            ${this.loading
              ? html`
                  <span class="spinner"></span>
                  ${msg('Signing in...')}
                `
              : html`
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                    />
                  </svg>
                  ${msg('Sign In')}
                `}
          </button>
        </form>

        <div class="help-section">
          <h3 class="help-title">${msg('How to create a token')}</h3>
          <ol class="help-steps">
            <li data-step="1.">
              Go to
              <a href="https://github.com/settings/personal-access-tokens/new" target="_blank"
                >GitHub Fine-grained Tokens</a
              >
            </li>
            <li data-step="2.">Give it a name (e.g., "Kabane")</li>
            <li data-step="3.">
              Set <strong>Repository access</strong> → "Only select repositories" → choose your repo
            </li>
            <li data-step="4.">Set <strong>Contents</strong> permission to "Read and write"</li>
            <li data-step="5.">Click "Generate token" and copy it</li>
          </ol>

          <div class="scopes-note">
            💡 <strong>Fine-grained tokens</strong> only access the repos you choose - much safer than classic tokens!
          </div>
        </div>

        <div class="security-note">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm.5 4.5v5h-1v-5h1Zm0 6v1h-1v-1h1Z" />
          </svg>
          <span>
            Your token is stored only in this browser session and is never sent to any server except GitHub's API. You
            can revoke it anytime at
            <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a>.
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-login': KabaneLogin;
  }
}
