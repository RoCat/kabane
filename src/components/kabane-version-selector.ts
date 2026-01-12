/**
 * Version Selector Component
 *
 * Displays a dropdown to select versions and a button to create new ones.
 * Shows version info (name, dates, status) and allows switching between versions.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles } from '../styles';
import { getLocale } from '../localization';
import type { Version } from '../types';

@localized()
@customElement('kabane-version-selector')
export class KabaneVersionSelector extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-sm) var(--space-lg);
        background: var(--color-bg-secondary);
      }

      .version-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        font-weight: 500;
      }

      .version-select {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      select {
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-xs) var(--space-md);
        font-size: var(--font-size-sm);
        cursor: pointer;
        min-width: 200px;
      }

      select:hover {
        border-color: var(--color-border-hover);
      }

      select:focus {
        outline: none;
        border-color: var(--color-accent-secondary);
      }

      .version-info {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .version-dates {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
      }

      .btn-new-version {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: transparent;
        color: var(--color-accent-secondary);
        border: 1px solid var(--color-accent-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-xs) var(--space-sm);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-new-version:hover {
        background: var(--color-accent-secondary);
        color: white;
      }

      .btn-new-version:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .spacer {
        flex: 1;
      }

      /* Modal styles */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 450px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--color-border-default);
      }

      .modal-header h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      .modal-close {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .modal-close:hover {
        color: var(--color-text-primary);
      }

      .modal-body {
        padding: var(--space-lg);
        overflow-y: auto;
      }

      .form-group {
        margin-bottom: var(--space-md);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-xs);
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-sm);
        font-size: var(--font-size-base);
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: var(--color-accent-secondary);
      }

      .form-group textarea {
        min-height: 80px;
        resize: vertical;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        border-top: 1px solid var(--color-border-default);
      }

      .btn {
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary {
        background: transparent;
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border-default);
      }

      .btn-secondary:hover {
        background: var(--color-bg-tertiary);
      }

      .btn-primary {
        background: var(--color-accent-secondary);
        color: white;
        border: none;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ];

  @property({ type: Array })
  versions: Version[] = [];

  @property({ type: String })
  selectedVersionId: string | null = null;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Boolean })
  disabled = false;

  @state()
  private showModal = false;

  @state()
  private isEditMode = false;

  @state()
  private newVersion: Partial<Version> = {};

  @state()
  private saving = false;

  private get selectedVersion(): Version | null {
    if (!this.selectedVersionId) return null;
    return this.versions.find(v => v.id === this.selectedVersionId) || null;
  }

  private handleVersionChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const value = select.value || null;

    this.dispatchEvent(
      new CustomEvent('version-change', {
        detail: { versionId: value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private openModal() {
    this.isEditMode = false;
    this.newVersion = {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
    };
    this.showModal = true;
  }

  private openEditModal() {
    if (!this.selectedVersion) return;
    this.isEditMode = true;
    this.newVersion = { ...this.selectedVersion };
    this.showModal = true;
  }

  private closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.newVersion = {};
  }

  private handleInputChange(field: keyof Version, value: string) {
    this.newVersion = { ...this.newVersion, [field]: value };
  }

  private async handleCreateVersion() {
    if (!this.newVersion.name?.trim()) return;

    this.saving = true;

    if (this.isEditMode && this.selectedVersion) {
      // Editing existing version
      this.dispatchEvent(
        new CustomEvent('version-update', {
          detail: {
            version: {
              ...this.selectedVersion,
              name: this.newVersion.name.trim(),
              startDate: this.newVersion.startDate,
              targetDate: this.newVersion.targetDate,
            },
          },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      // Creating new version
      this.dispatchEvent(
        new CustomEvent('version-create', {
          detail: {
            version: {
              name: this.newVersion.name.trim(),
              startDate: this.newVersion.startDate,
              targetDate: this.newVersion.targetDate,
            },
          },
          bubbles: true,
          composed: true,
        }),
      );
    }

    this.closeModal();
    this.saving = false;
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US';
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  render() {
    return html`
      <span class="version-label">📦 ${msg('Version')}:</span>

      <div class="version-select">
        <select @change=${this.handleVersionChange}>
          <option value="">${msg('All versions')}</option>
          ${this.versions.map(
            v => html` <option value=${v.id} ?selected=${v.id === this.selectedVersionId}>${v.name}</option> `,
          )}
        </select>
      </div>

      ${this.selectedVersion
        ? html`
            <div class="version-info">
              <div class="version-dates">
                <span>📅 ${this.formatDate(this.selectedVersion.startDate)}</span>
                <span>→</span>
                <span>🎯 ${this.formatDate(this.selectedVersion.targetDate)}</span>
              </div>
            </div>
          `
        : ''}

      <div class="spacer"></div>

      ${!this.disabled
        ? html`
            ${this.selectedVersion
              ? html`
                  <button class="btn-new-version" @click=${this.openEditModal} title=${msg('Edit version')}>
                    <span>✏️</span>
                    <span>${msg('Edit')}</span>
                  </button>
                `
              : ''}
            <button class="btn-new-version" @click=${this.openModal}>
              <span>+</span>
              <span>${msg('New version')}</span>
            </button>
          `
        : ''}
      ${this.showModal ? this.renderModal() : ''}
    `;
  }

  private renderModal() {
    return html`
      <div
        class="modal-overlay"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.closeModal();
        }}
      >
        <div class="modal">
          <div class="modal-header">
            <h3>${this.isEditMode ? msg('Edit version') : msg('New version')}</h3>
            <button class="modal-close" @click=${this.closeModal}>×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="version-name">${msg('Version name')} *</label>
              <input
                id="version-name"
                type="text"
                placeholder="v1.0, Sprint 1, etc."
                .value=${this.newVersion.name || ''}
                @input=${(e: Event) => this.handleInputChange('name', (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="version-start">${msg('Start date')}</label>
                <input
                  id="version-start"
                  type="date"
                  .value=${this.newVersion.startDate || ''}
                  @input=${(e: Event) => this.handleInputChange('startDate', (e.target as HTMLInputElement).value)}
                />
              </div>

              <div class="form-group">
                <label for="version-target">${msg('Target date')}</label>
                <input
                  id="version-target"
                  type="date"
                  .value=${this.newVersion.targetDate || ''}
                  @input=${(e: Event) => this.handleInputChange('targetDate', (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click=${this.closeModal}>${msg('Cancel')}</button>
            <button
              class="btn btn-primary"
              @click=${this.handleCreateVersion}
              ?disabled=${!this.newVersion.name?.trim() || this.saving}
            >
              ${this.saving
                ? this.isEditMode
                  ? msg('Saving...')
                  : msg('Creating...')
                : this.isEditMode
                  ? msg('Save')
                  : msg('Create')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-version-selector': KabaneVersionSelector;
  }
}
