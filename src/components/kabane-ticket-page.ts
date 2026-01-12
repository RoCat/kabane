/**
 * Ticket Detail Page Component
 *
 * Full-page view of a ticket in read-only mode.
 * Includes back button and edit button.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles, buttonStyles, badgeStyles } from '../styles';
import { getLocale } from '../localization';
import type { Ticket, KabaneConfig, GitHubRepository } from '../types';
import { getImageAsDataUrl } from '../api/github';
import { authStore } from '../auth/store';

@localized()
@customElement('kabane-ticket-page')
export class KabaneTicketPage extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    buttonStyles,
    badgeStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
        background: var(--color-bg-primary);
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-lg);
        border-bottom: 1px solid var(--color-border-default);
        background: var(--color-bg-secondary);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .btn-back {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: transparent;
        border: 1px solid var(--color-border-default);
        color: var(--color-text-secondary);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all 0.2s;
      }

      .btn-back:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      .header-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .header-title h1 {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: 600;
      }

      .btn-edit {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--color-accent-secondary);
        border: none;
        color: white;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: opacity 0.2s;
      }

      .btn-edit:hover {
        opacity: 0.9;
      }

      .btn-edit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-content {
        max-width: 900px;
        margin: 0 auto;
        padding: var(--space-xl);
      }

      .ticket-header {
        margin-bottom: var(--space-xl);
      }

      .ticket-title {
        font-size: var(--font-size-xl);
        font-weight: 600;
        margin: 0 0 var(--space-md);
        line-height: 1.3;
      }

      .ticket-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        align-items: center;
      }

      .ticket-id {
        font-family: var(--font-mono);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .section {
        margin-bottom: var(--space-xl);
      }

      .section-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 var(--space-md);
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--color-border-muted);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--space-lg);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .info-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .info-value {
        font-size: var(--font-size-base);
        color: var(--color-text-primary);
      }

      .info-value.empty {
        color: var(--color-text-muted);
        font-style: italic;
      }

      .description {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        white-space: pre-wrap;
        font-family: var(--font-base);
        line-height: 1.6;
      }

      .description.empty {
        color: var(--color-text-muted);
        font-style: italic;
      }

      .labels-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
      }

      .label-tag {
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: var(--font-size-sm);
      }

      .assignees-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
      }

      .assignee-chip {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--color-bg-tertiary);
        padding: var(--space-xs) var(--space-sm);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
      }

      .assignee-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-accent-secondary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
      }

      .timestamps {
        display: flex;
        gap: var(--space-lg);
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin-top: var(--space-xl);
        padding-top: var(--space-md);
        border-top: 1px solid var(--color-border-muted);
      }

      .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--space-md);
      }

      .image-item {
        aspect-ratio: 16/10;
        border-radius: var(--radius-md);
        overflow: hidden;
        border: 1px solid var(--color-border-default);
        cursor: pointer;
        transition: transform 0.2s;
      }

      .image-item:hover {
        transform: scale(1.02);
      }

      .image-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-item.loading {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-loading,
      .image-error {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        text-align: center;
        padding: var(--space-md);
      }

      .image-error {
        background: var(--color-bg-tertiary);
      }

      .image-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        cursor: zoom-out;
      }

      .image-modal img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: var(--radius-md);
      }

      .image-modal-close {
        position: absolute;
        top: var(--space-lg);
        right: var(--space-lg);
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-modal-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Children tickets styles */
      .children-tickets {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .child-ticket {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-sm) var(--space-md);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s;
      }

      .child-ticket:hover {
        background: var(--color-bg-tertiary);
        border-color: var(--color-border-emphasis);
      }

      .child-ticket-type {
        font-size: var(--font-size-base);
        flex-shrink: 0;
      }

      .child-ticket-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .child-ticket-title {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .child-ticket-id {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .child-ticket-version,
      .child-ticket-status {
        flex-shrink: 0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: var(--font-size-xs);
        font-weight: 500;
        text-transform: capitalize;
      }

      .child-ticket-status.status-backlog {
        background: var(--color-bg-tertiary);
        color: var(--color-text-muted);
      }

      .child-ticket-status.status-todo {
        background: rgba(88, 166, 255, 0.15);
        color: #58a6ff;
      }

      .child-ticket-status.status-in-progress {
        background: rgba(210, 153, 34, 0.15);
        color: #d29922;
      }

      .child-ticket-status.status-review {
        background: rgba(163, 113, 247, 0.15);
        color: #a371f7;
      }

      .child-ticket-status.status-done {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
      }
    `,
  ];

  @property({ type: Object })
  ticket: Ticket | null = null;

  @property({ type: Array })
  allTickets: Ticket[] = [];

  @property({ type: Object })
  config: KabaneConfig | null = null;

  @property({ type: Object })
  repository: GitHubRepository | null = null;

  @property({ type: Boolean })
  readonly = false;

  @state()
  private imageDataUrls: Map<string, string> = new Map();

  @state()
  private loadingImages: Set<string> = new Set();

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ticket') || changedProperties.has('repository')) {
      this.loadImages();
    }
  }

  private get childrenTickets(): Ticket[] {
    return this.ticket?.id ? this.allTickets.filter(t => t.parent === this.ticket?.id) : [];
  }

  private async loadImages() {
    if (!this.ticket?.images?.length || !this.repository) return;

    const token = authStore.getToken();
    if (!token) return;

    const [owner, repo] = this.repository.full_name.split('/');

    for (const imageName of this.ticket.images) {
      if (this.imageDataUrls.has(imageName) || this.loadingImages.has(imageName)) continue;

      this.loadingImages = new Set([...this.loadingImages, imageName]);

      try {
        const dataUrl = await getImageAsDataUrl(
          owner,
          repo,
          this.ticket.id,
          imageName,
          token,
          this.repository.default_branch,
        );
        this.imageDataUrls = new Map([...this.imageDataUrls, [imageName, dataUrl]]);
      } catch (error) {
        console.error(`Failed to load image ${imageName}:`, error);
        // Set a placeholder for failed images
        this.imageDataUrls = new Map([...this.imageDataUrls, [imageName, '']]);
      }

      this.loadingImages = new Set([...this.loadingImages].filter(n => n !== imageName));
    }
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      epic: '🎯',
      story: '📖',
      bug: '🐛',
      task: '✅',
    };
    return icons[type] || '📌';
  }

  private getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      backlog: 'status-backlog',
      todo: 'status-todo',
      'in-progress': 'status-in-progress',
      review: 'status-review',
      done: 'status-done',
    };
    return statusMap[status] || 'status-backlog';
  }

  private handleChildTicketClick(ticket: Ticket) {
    this.dispatchEvent(
      new CustomEvent('view-ticket', {
        detail: { ticket },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent('back', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleEdit() {
    this.dispatchEvent(
      new CustomEvent('edit-ticket', {
        detail: { ticket: this.ticket },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US';
      return new Date(dateStr).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  private getVersionName(versionId?: string): string {
    if (!versionId || !this.config?.versions) return '-';
    const version = this.config.versions.find(v => v.id === versionId);
    return version?.name || versionId;
  }

  private getImageSrc(imageName: string): string {
    return this.imageDataUrls.get(imageName) || '';
  }

  private isImageLoading(imageName: string): boolean {
    return this.loadingImages.has(imageName);
  }

  private openImageModal(imageName: string) {
    const src = this.getImageSrc(imageName);
    if (!src) return;

    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <img src="${src}" alt="${imageName}" />
      <button class="image-modal-close" title="${msg('Close')}">✕</button>
    `;

    const closeModal = () => {
      modal.remove();
    };

    modal.addEventListener('click', closeModal);
    modal.querySelector('.image-modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('img')?.addEventListener('click', e => e.stopPropagation());

    this.shadowRoot?.appendChild(modal);
  }

  private renderImagesSection() {
    if (!this.ticket?.images?.length) return '';

    return html`
      <div class="section">
        <h2 class="section-title">${msg('Images')} (${this.ticket.images.length})</h2>
        <div class="images-grid">
          ${this.ticket.images.map(imageName => {
            const src = this.getImageSrc(imageName);
            const isLoading = this.isImageLoading(imageName);

            return html`
              <div class="image-item ${isLoading ? 'loading' : ''}" @click=${() => this.openImageModal(imageName)}>
                ${isLoading
                  ? html` <div class="image-loading">${msg('Loading image...')}</div> `
                  : src
                    ? html` <img src=${src} alt=${imageName} /> `
                    : html` <div class="image-error">${msg('Image not available')}</div> `}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.ticket) return html`<div>${msg('Ticket not found')}</div>`;

    return html`
      <div class="page-header">
        <button class="btn-back" @click=${this.handleBack}>
          <span>←</span>
          <span>${msg('Back')}</span>
        </button>

        <div class="header-title">
          <span>${this.getTypeIcon(this.ticket.type)}</span>
          <span class="badge badge-${this.ticket.type}">${this.ticket.type}</span>
          <span class="ticket-id">#${this.ticket.id}</span>
        </div>

        ${!this.readonly
          ? html`
              <button class="btn-edit" @click=${this.handleEdit}>
                <span>✏️</span>
                <span>${msg('Edit')}</span>
              </button>
            `
          : ''}
      </div>

      <div class="page-content">
        <div class="ticket-header">
          <h1 class="ticket-title">${this.ticket.title}</h1>
          <div class="ticket-meta">
            ${this.ticket.priority
              ? html` <span class="badge badge-priority-${this.ticket.priority}"> ${this.ticket.priority} </span> `
              : ''}
            <span class="badge">${this.ticket.status}</span>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">${msg('Information')}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">${msg('Status')}</span>
              <span class="info-value">${this.ticket.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">${msg('Priority')}</span>
              <span class="info-value ${!this.ticket.priority ? 'empty' : ''}">
                ${this.ticket.priority || msg('Not defined')}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">${msg('Version')}</span>
              <span class="info-value ${!this.ticket.version ? 'empty' : ''}">
                ${this.getVersionName(this.ticket.version) || msg('Not assigned')}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">${msg('Estimation (points)')}</span>
              <span class="info-value ${!this.ticket.estimate ? 'empty' : ''}">
                ${this.ticket.estimate ? `${this.ticket.estimate} ${msg('points')}` : msg('Not estimated')}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">${msg('Due date')}</span>
              <span class="info-value ${!this.ticket.dueDate ? 'empty' : ''}">
                ${this.ticket.dueDate ? this.formatDate(this.ticket.dueDate) : msg('Not defined')}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">${msg('Parent ticket')}</span>
              <span class="info-value ${!this.ticket.parent ? 'empty' : ''}">
                ${this.ticket.parent || msg('No parent')}
              </span>
            </div>
          </div>
        </div>

        ${this.ticket.assignees?.length
          ? html`
              <div class="section">
                <h2 class="section-title">${msg('Assignees')}</h2>
                <div class="assignees-list">
                  ${this.ticket.assignees.map(
                    assignee => html`
                      <span class="assignee-chip">
                        <span class="assignee-avatar">${assignee.charAt(0).toUpperCase()}</span>
                        <span>${assignee}</span>
                      </span>
                    `,
                  )}
                </div>
              </div>
            `
          : ''}
        ${this.ticket.labels?.length
          ? html`
              <div class="section">
                <h2 class="section-title">${msg('Labels')}</h2>
                <div class="labels-list">
                  ${this.ticket.labels.map(label => html` <span class="label-tag">${label}</span> `)}
                </div>
              </div>
            `
          : ''}

        <div class="section">
          <h2 class="section-title">${msg('Description')}</h2>
          <div class="description ${!this.ticket.description ? 'empty' : ''}">
            ${this.ticket.description || msg('No description')}
          </div>
        </div>

        ${this.childrenTickets.length
          ? html`<div class="section">
              <h2 class="section-title">${msg('Children tickets')}</h2>
              <div class="children-tickets">
                ${this.childrenTickets.map(
                  ct => html`
                    <div class="child-ticket" @click=${() => this.handleChildTicketClick(ct)}>
                      <span class="child-ticket-type">${this.getTypeIcon(ct.type)}</span>
                      <div class="child-ticket-info">
                        <span class="child-ticket-title">${ct.title}</span>
                        <span class="child-ticket-id">${ct.id}</span>
                      </div>
                      <span class="child-ticket-status ${this.getStatusClass(ct.status)}">${ct.status}</span>
                      <span class="child-ticket-version">${this.getVersionName(ct.version)}</span>
                    </div>
                  `,
                )}
              </div>
            </div>`
          : nothing}
        ${this.renderImagesSection()}

        <div class="timestamps">
          <span>${msg('Created on')} ${this.formatDate(this.ticket.createdAt)}</span>
          ${this.ticket.updatedAt
            ? html` <span>${msg('Modified on')} ${this.formatDate(this.ticket.updatedAt)}</span> `
            : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-ticket-page': KabaneTicketPage;
  }
}
