/**
 * Header Component
 *
 * Top navigation bar with user info and repository selector.
 */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles, buttonStyles } from '../styles';
import './kabane-language-selector';
import { MobxReactionUpdate } from '@adobe/lit-mobx';
import { appMobx } from '@/utils/app-mobx';

@localized()
@customElement('kabane-header')
export class KabaneHeader extends MobxReactionUpdate(LitElement) {
  static styles = [
    themeStyles,
    resetStyles,
    buttonStyles,
    css`
      :host {
        display: block;
        background: var(--color-bg-secondary);
        border-bottom: 1px solid var(--color-border-default);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--header-height);
        padding: 0 var(--space-lg);
        max-width: 1600px;
        margin: 0 auto;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .logo {
        font-size: 24px;
      }

      .title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .repo-info {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .repo-name {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-xs) var(--space-sm);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .repo-icon {
        width: 16px;
        height: 16px;
        opacity: 0.7;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--color-border-default);
      }

      .username {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .sign-out-btn {
        padding: var(--space-xs) var(--space-sm);
        font-size: var(--font-size-xs);
      }

      .read-only-badge {
        background: rgba(210, 153, 34, 0.2);
        color: var(--color-accent-warning);
        padding: 2px var(--space-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 500;
      }
    `,
  ];

  private handleSignOut() {
    this.dispatchEvent(new CustomEvent('sign-out', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <header class="header">
        <div class="brand">
          <span class="logo">📋</span>
          <span class="title">Kabane</span>

          ${appMobx.repository
            ? html`
                <div class="repo-info">
                  <div class="repo-name">
                    <svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path
                        d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"
                      />
                    </svg>
                    ${appMobx.repository.full_name}
                  </div>
                  ${!appMobx.canEdit ? html` <span class="read-only-badge">${msg('Read only')}</span> ` : ''}
                </div>
              `
            : ''}
        </div>

        <div class="actions">
          <kabane-language-selector></kabane-language-selector>

          ${appMobx.user
            ? html`
                <div class="user-info">
                  <img class="avatar" src="${appMobx.user.avatar_url}" alt="${appMobx.user.login}" />
                  <span class="username">${appMobx.user.login}</span>
                </div>
                <button class="btn-ghost sign-out-btn" @click=${this.handleSignOut}>${msg('Sign Out')}</button>
              `
            : ''}
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-header': KabaneHeader;
  }
}
