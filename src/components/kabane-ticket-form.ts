/**
 * Ticket Form Component
 *
 * Full-page form for creating or editing a ticket.
 * Used for both new tickets and editing existing ones.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import { themeStyles, resetStyles, buttonStyles, inputStyles, badgeStyles } from '../styles';
import type { Ticket, KabaneConfig, TicketTypeId, GitHubRepository, GitHubUser } from '../types';
import { uploadImage, deleteImage, isValidImageExtension, getImageAsDataUrl } from '../api/github';

@localized()
@customElement('kabane-ticket-form')
export class KabaneTicketForm extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    buttonStyles,
    inputStyles,
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
      }

      .header-title h1 {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: var(--space-sm);
      }

      .btn-cancel {
        background: transparent;
        border: 1px solid var(--color-border-default);
        color: var(--color-text-secondary);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all 0.2s;
      }

      .btn-cancel:hover {
        background: var(--color-bg-tertiary);
      }

      .btn-save {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--color-accent-success);
        border: none;
        color: white;
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .btn-save:hover {
        opacity: 0.9;
      }

      .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-content {
        max-width: 800px;
        margin: 0 auto;
        padding: var(--space-xl);
      }

      .form-section {
        margin-bottom: var(--space-xl);
      }

      .section-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 var(--space-md);
      }

      .field {
        margin-bottom: var(--space-lg);
      }

      .field label {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
        margin-bottom: var(--space-xs);
      }

      .field label .required {
        color: var(--color-accent-danger);
      }

      .field input,
      .field select,
      .field textarea {
        width: 100%;
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-sm) var(--space-md);
        font-size: var(--font-size-base);
        transition: border-color 0.2s;
      }

      .field input:focus,
      .field select:focus,
      .field textarea:focus {
        outline: none;
        border-color: var(--color-accent-secondary);
      }

      .field input.error,
      .field select.error {
        border-color: var(--color-accent-danger);
      }

      .field .error-message {
        color: var(--color-accent-danger);
        font-size: var(--font-size-xs);
        margin-top: var(--space-xs);
      }

      .field textarea {
        min-height: 200px;
        resize: vertical;
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      .field-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-md);
      }

      .field-row-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-md);
      }

      .field .hint {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin-top: var(--space-xs);
      }

      .title-input {
        font-size: var(--font-size-lg) !important;
        font-weight: 500;
      }

      @media (max-width: 600px) {
        .field-row,
        .field-row-3 {
          grid-template-columns: 1fr;
        }
      }

      /* Image upload styles */
      .image-upload-zone {
        border: 2px dashed var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--color-bg-secondary);
      }

      .image-upload-zone:hover,
      .image-upload-zone.dragover {
        border-color: var(--color-accent-secondary);
        background: var(--color-bg-tertiary);
      }

      .image-upload-zone.uploading {
        opacity: 0.7;
        pointer-events: none;
      }

      .upload-icon {
        font-size: 2rem;
        margin-bottom: var(--space-sm);
      }

      .upload-text {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .upload-hint {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        margin-top: var(--space-xs);
      }

      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--space-md);
        margin-top: var(--space-md);
      }

      .image-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: var(--radius-md);
        overflow: hidden;
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-tertiary);
      }

      .image-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-item .delete-btn {
        position: absolute;
        top: var(--space-xs);
        right: var(--space-xs);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .image-item:hover .delete-btn {
        opacity: 1;
      }

      .image-item .delete-btn:hover {
        background: var(--color-accent-danger);
      }

      .image-item.deleting {
        opacity: 0.5;
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
      }

      .upload-error {
        color: var(--color-accent-danger);
        font-size: var(--font-size-sm);
        margin-top: var(--space-sm);
        padding: var(--space-sm);
        background: rgba(248, 81, 73, 0.1);
        border-radius: var(--radius-sm);
      }

      /* Multi-select assignees styles */
      .multi-select {
        position: relative;
      }

      .multi-select-container {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        padding: var(--space-xs);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        min-height: 42px;
        cursor: text;
        transition: border-color 0.2s;
      }

      .multi-select-container:focus-within {
        border-color: var(--color-accent-secondary);
      }

      .multi-select-tag {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        padding: 2px var(--space-sm);
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }

      .multi-select-tag img {
        width: 18px;
        height: 18px;
        border-radius: 50%;
      }

      .multi-select-tag .remove-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
        font-size: 12px;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .multi-select-tag .remove-btn:hover {
        background: var(--color-accent-danger);
        color: white;
      }

      .multi-select-input {
        flex: 1;
        min-width: 120px;
        border: none;
        background: transparent;
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        padding: var(--space-xs);
        outline: none;
      }

      .multi-select-input::placeholder {
        color: var(--color-text-muted);
      }

      .multi-select-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: var(--space-xs);
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        max-height: 200px;
        overflow-y: auto;
        z-index: 100;
      }

      .multi-select-option {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        cursor: pointer;
        transition: background 0.2s;
      }

      .multi-select-option:hover,
      .multi-select-option.highlighted {
        background: var(--color-bg-tertiary);
      }

      .multi-select-option.selected {
        background: var(--color-accent-secondary);
        color: white;
      }

      .multi-select-option img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      .multi-select-option-info {
        display: flex;
        flex-direction: column;
      }

      .multi-select-option-name {
        font-weight: 500;
      }

      .multi-select-option-login {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .multi-select-option.selected .multi-select-option-login {
        color: rgba(255, 255, 255, 0.7);
      }

      .multi-select-add-custom {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-top: 1px solid var(--color-border-default);
        cursor: pointer;
        color: var(--color-accent-secondary);
        font-size: var(--font-size-sm);
        transition: background 0.2s;
      }

      .multi-select-add-custom:hover,
      .multi-select-add-custom.highlighted {
        background: var(--color-bg-tertiary);
      }

      .multi-select-no-results {
        padding: var(--space-md);
        text-align: center;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }
    `,
  ];

  @property({ type: Object })
  ticket: Ticket | null = null;

  @property({ type: Array })
  allTickets: Array<Ticket> = [];

  @property({ type: Object })
  config: KabaneConfig | null = null;

  @property({ type: Boolean })
  saving = false;

  @property({ type: String })
  selectedVersionId: string | null = null;

  @property({ type: Object })
  repository: GitHubRepository | null = null;

  @property({ type: String })
  token: string = '';

  @property({ type: Array })
  contributors: GitHubUser[] = [];

  @state()
  private formData: Partial<Ticket> = {};

  @state()
  private errors: Record<string, string> = {};

  @state()
  private touched: Record<string, boolean> = {};

  @state()
  private uploadingImages = false;

  @state()
  private deletingImages: Set<string> = new Set();

  @state()
  private uploadError: string | null = null;

  @state()
  private dragover = false;

  @state()
  private imageDataUrls: Map<string, string> = new Map();

  @state()
  private loadingImages: Set<string> = new Set();

  @state()
  private assigneeInputValue = '';

  @state()
  private showAssigneeDropdown = false;

  @state()
  private highlightedAssigneeIndex = -1;

  @state()
  private parentInputValue = '';

  @state()
  private showParentDropdown = false;

  @state()
  private highlightedParentIndex = -1;

  private get isEditing(): boolean {
    return this.ticket !== null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.initFormData();
  }

  private get parentCandidates(): Ticket[] {
    return this.allTickets.filter(t => t.id !== this.ticket?.id);
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ticket')) {
      this.initFormData();
      this.loadImages();
    }
  }

  private async loadImages() {
    if (!this.ticket?.images?.length || !this.repository || !this.token) return;

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
          this.token,
          this.repository.default_branch,
        );
        this.imageDataUrls = new Map([...this.imageDataUrls, [imageName, dataUrl]]);
      } catch (error) {
        console.error(`Failed to load image ${imageName}:`, error);
        this.imageDataUrls = new Map([...this.imageDataUrls, [imageName, '']]);
      }

      this.loadingImages = new Set([...this.loadingImages].filter(n => n !== imageName));
    }
  }

  private initFormData() {
    if (this.ticket) {
      // Editing existing ticket
      this.formData = { ...this.ticket };
    } else {
      // Creating new ticket
      this.formData = {
        title: '',
        type: 'task',
        status: 'backlog',
        priority: undefined,
        version: this.selectedVersionId || undefined,
        assignees: [],
        labels: [],
        description: '',
      };
    }
    this.errors = {};
    this.touched = {};
  }

  private handleFieldChange(field: keyof Ticket, value: unknown) {
    this.formData = { ...this.formData, [field]: value };
    this.touched = { ...this.touched, [field]: true };
    this.validateField(field);
  }

  private validateField(field: string) {
    const newErrors = { ...this.errors };

    switch (field) {
      case 'title':
        if (!this.formData.title?.trim()) {
          newErrors.title = msg('Title is required');
        } else {
          delete newErrors.title;
        }
        break;
      case 'id':
        if (!this.isEditing) {
          if (!this.formData.id?.trim()) {
            newErrors.id = msg('Identifier is required');
          } else if (!/^[a-z0-9-]+$/.test(this.formData.id)) {
            newErrors.id = msg('Only lowercase letters, numbers, and hyphens');
          } else {
            delete newErrors.id;
          }
        }
        break;
    }

    this.errors = newErrors;
  }

  private validateForm(): boolean {
    this.validateField('title');
    if (!this.isEditing) {
      this.validateField('id');
    }
    return Object.keys(this.errors).length === 0;
  }

  private generateId(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private handleTitleChange(value: string) {
    this.handleFieldChange('title', value);

    // Auto-generate ID for new tickets if ID hasn't been manually edited
    if (!this.isEditing && !this.touched.id) {
      const generatedId = this.generateId(value);
      this.formData = { ...this.formData, id: generatedId };
    }
  }

  private handleBack() {
    this.dispatchEvent(
      new CustomEvent('cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSave() {
    if (!this.validateForm()) return;

    if (this.isEditing && this.ticket) {
      // Emit changes for existing ticket
      const changes: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(this.formData)) {
        if (this.ticket[key as keyof Ticket] !== value) {
          changes[key] = value;
        }
      }

      this.dispatchEvent(
        new CustomEvent('save', {
          detail: {
            ticket: this.ticket,
            changes,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      // Emit new ticket data
      this.dispatchEvent(
        new CustomEvent('create', {
          detail: {
            ticket: {
              ...this.formData,
              id: this.formData.id || this.generateId(this.formData.title || 'ticket'),
            },
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private getStatusOptions(): string[] {
    const statuses = ['backlog'];
    if (this.config?.columns) {
      this.config.columns.forEach(col => {
        col.statuses.forEach(s => {
          if (!statuses.includes(s)) statuses.push(s);
        });
      });
    } else {
      statuses.push('todo', 'in-progress', 'review', 'done');
    }
    return statuses;
  }

  // Assignees multi-select methods
  private getFilteredContributors(): GitHubUser[] {
    const currentAssignees = this.formData.assignees || [];
    const searchTerm = this.assigneeInputValue.toLowerCase();

    return this.contributors.filter(contributor => {
      // Exclude already selected
      if (currentAssignees.includes(contributor.login)) return false;

      // Filter by search term
      if (searchTerm) {
        return (
          contributor.login.toLowerCase().includes(searchTerm) || contributor.name?.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }

  private handleAssigneeInputFocus() {
    this.showAssigneeDropdown = true;
    this.highlightedAssigneeIndex = -1;
  }

  private handleAssigneeInputBlur() {
    // Delay to allow click on dropdown
    setTimeout(() => {
      this.showAssigneeDropdown = false;
      this.highlightedAssigneeIndex = -1;
    }, 200);
  }

  private handleAssigneeInputChange(e: Event) {
    this.assigneeInputValue = (e.target as HTMLInputElement).value;
    this.showAssigneeDropdown = true;
    this.highlightedAssigneeIndex = -1;
  }

  private handleAssigneeKeyDown(e: KeyboardEvent) {
    const filtered = this.getFilteredContributors();
    const canAddCustom =
      this.assigneeInputValue.trim() &&
      !this.contributors.some(c => c.login.toLowerCase() === this.assigneeInputValue.toLowerCase()) &&
      !(this.formData.assignees || []).includes(this.assigneeInputValue.trim());

    const totalOptions = filtered.length + (canAddCustom ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedAssigneeIndex = Math.min(this.highlightedAssigneeIndex + 1, totalOptions - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightedAssigneeIndex = Math.max(this.highlightedAssigneeIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlightedAssigneeIndex >= 0 && this.highlightedAssigneeIndex < filtered.length) {
          this.addAssignee(filtered[this.highlightedAssigneeIndex].login);
        } else if (this.highlightedAssigneeIndex === filtered.length && canAddCustom) {
          this.addAssignee(this.assigneeInputValue.trim());
        } else if (this.assigneeInputValue.trim()) {
          // Add custom value if no selection
          this.addAssignee(this.assigneeInputValue.trim());
        }
        break;
      case 'Backspace':
        if (!this.assigneeInputValue && (this.formData.assignees?.length || 0) > 0) {
          // Remove last assignee
          const assignees = [...(this.formData.assignees || [])];
          assignees.pop();
          this.handleFieldChange('assignees', assignees.length ? assignees : undefined);
        }
        break;
      case 'Escape':
        this.showAssigneeDropdown = false;
        this.highlightedAssigneeIndex = -1;
        break;
    }
  }

  private addAssignee(login: string) {
    const currentAssignees = this.formData.assignees || [];
    if (!currentAssignees.includes(login)) {
      this.handleFieldChange('assignees', [...currentAssignees, login]);
    }
    this.assigneeInputValue = '';
    this.highlightedAssigneeIndex = -1;
  }

  private removeAssignee(login: string) {
    const assignees = (this.formData.assignees || []).filter(a => a !== login);
    this.handleFieldChange('assignees', assignees.length ? assignees : undefined);
  }

  private getContributorByLogin(login: string): GitHubUser | undefined {
    return this.contributors.find(c => c.login === login);
  }

  private renderAssigneesField() {
    const assignees = this.formData.assignees || [];
    const filtered = this.getFilteredContributors();
    const canAddCustom =
      this.assigneeInputValue.trim() &&
      !this.contributors.some(c => c.login.toLowerCase() === this.assigneeInputValue.toLowerCase()) &&
      !assignees.includes(this.assigneeInputValue.trim());

    return html`
      <div class="multi-select">
        <div
          class="multi-select-container"
          @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('.multi-select-input')?.focus()}
        >
          ${assignees.map(login => {
            const contributor = this.getContributorByLogin(login);
            return html`
              <span class="multi-select-tag">
                ${contributor?.avatar_url ? html` <img src="${contributor.avatar_url}" alt="${login}" /> ` : ''}
                <span>${login}</span>
                <button
                  type="button"
                  class="remove-btn"
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this.removeAssignee(login);
                  }}
                  title=${msg('Remove')}
                >
                  ✕
                </button>
              </span>
            `;
          })}
          <input
            type="text"
            class="multi-select-input"
            placeholder=${assignees.length ? '' : msg('Search or add assignee...')}
            .value=${this.assigneeInputValue}
            @focus=${this.handleAssigneeInputFocus}
            @blur=${this.handleAssigneeInputBlur}
            @input=${this.handleAssigneeInputChange}
            @keydown=${this.handleAssigneeKeyDown}
          />
        </div>

        ${this.showAssigneeDropdown && (filtered.length > 0 || canAddCustom)
          ? html`
              <div class="multi-select-dropdown">
                ${filtered.map(
                  (contributor, index) => html`
                    <div
                      class="multi-select-option ${index === this.highlightedAssigneeIndex ? 'highlighted' : ''}"
                      @click=${() => this.addAssignee(contributor.login)}
                      @mouseenter=${() => (this.highlightedAssigneeIndex = index)}
                    >
                      <img src="${contributor.avatar_url}" alt="${contributor.login}" />
                      <div class="multi-select-option-info">
                        <span class="multi-select-option-name">${contributor.name || contributor.login}</span>
                        ${contributor.name
                          ? html` <span class="multi-select-option-login">@${contributor.login}</span> `
                          : ''}
                      </div>
                    </div>
                  `,
                )}
                ${canAddCustom
                  ? html`
                      <div
                        class="multi-select-add-custom ${filtered.length === this.highlightedAssigneeIndex
                          ? 'highlighted'
                          : ''}"
                        @click=${() => this.addAssignee(this.assigneeInputValue.trim())}
                        @mouseenter=${() => (this.highlightedAssigneeIndex = filtered.length)}
                      >
                        <span>+</span>
                        <span>${msg('Add')} "<strong>${this.assigneeInputValue.trim()}</strong>"</span>
                      </div>
                    `
                  : ''}
              </div>
            `
          : ''}
        ${this.showAssigneeDropdown && filtered.length === 0 && !canAddCustom && this.assigneeInputValue
          ? html`
              <div class="multi-select-dropdown">
                <div class="multi-select-no-results">${msg('No results')}</div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  // Parent ticket methods
  private getFilteredParentCandidates(): Ticket[] {
    const searchTerm = this.parentInputValue.toLowerCase();

    return this.parentCandidates.filter(ticket => {
      if (!searchTerm) return true;

      return ticket.id.toLowerCase().includes(searchTerm) || ticket.title.toLowerCase().includes(searchTerm);
    });
  }

  private handleParentInputFocus() {
    this.showParentDropdown = true;
    this.highlightedParentIndex = -1;
  }

  private handleParentInputBlur() {
    setTimeout(() => {
      this.showParentDropdown = false;
      this.highlightedParentIndex = -1;
    }, 200);
  }

  private handleParentInputChange(e: Event) {
    this.parentInputValue = (e.target as HTMLInputElement).value;
    this.showParentDropdown = true;
    this.highlightedParentIndex = -1;
  }

  private handleParentKeyDown(e: KeyboardEvent) {
    const filtered = this.getFilteredParentCandidates();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedParentIndex = Math.min(this.highlightedParentIndex + 1, filtered.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightedParentIndex = Math.max(this.highlightedParentIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlightedParentIndex >= 0 && this.highlightedParentIndex < filtered.length) {
          this.selectParent(filtered[this.highlightedParentIndex].id);
        }
        break;
      case 'Escape':
        this.showParentDropdown = false;
        this.highlightedParentIndex = -1;
        break;
    }
  }

  private selectParent(ticketId: string) {
    this.handleFieldChange('parent', ticketId);
    this.parentInputValue = '';
    this.showParentDropdown = false;
    this.highlightedParentIndex = -1;
  }

  private clearParent() {
    this.handleFieldChange('parent', undefined);
    this.parentInputValue = '';
  }

  private getTicketById(id: string): Ticket | undefined {
    return this.allTickets.find(t => t.id === id);
  }

  private getTicketTypeIcon(type: string): string {
    switch (type) {
      case 'epic':
        return '🎯';
      case 'story':
        return '📖';
      case 'bug':
        return '🐛';
      case 'task':
        return '✅';
      default:
        return '📝';
    }
  }

  private renderParentField() {
    const currentParent = this.formData.parent;
    const parentTicket = currentParent ? this.getTicketById(currentParent) : null;
    const filtered = this.getFilteredParentCandidates();

    return html`
      <div class="multi-select">
        <div
          class="multi-select-container"
          @click=${() => {
            if (!currentParent) {
              this.shadowRoot?.querySelector<HTMLInputElement>('.parent-select-input')?.focus();
            }
          }}
        >
          ${currentParent
            ? html`
                <span class="multi-select-tag">
                  ${parentTicket
                    ? html`
                        <span>${this.getTicketTypeIcon(parentTicket.type)}</span>
                        <span>${parentTicket.title}</span>
                      `
                    : html` <span>${currentParent}</span> `}
                  <button
                    type="button"
                    class="remove-btn"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      this.clearParent();
                    }}
                    title=${msg('Remove')}
                  >
                    ✕
                  </button>
                </span>
              `
            : html`
                <input
                  type="text"
                  class="multi-select-input parent-select-input"
                  placeholder=${msg('Search parent ticket...')}
                  .value=${this.parentInputValue}
                  @focus=${this.handleParentInputFocus}
                  @blur=${this.handleParentInputBlur}
                  @input=${this.handleParentInputChange}
                  @keydown=${this.handleParentKeyDown}
                />
              `}
        </div>

        ${this.showParentDropdown && !currentParent
          ? html`
              <div class="multi-select-dropdown">
                ${filtered.length > 0
                  ? filtered.slice(0, 10).map(
                      (ticket, index) => html`
                        <div
                          class="multi-select-option ${index === this.highlightedParentIndex ? 'highlighted' : ''}"
                          @click=${() => this.selectParent(ticket.id)}
                          @mouseenter=${() => (this.highlightedParentIndex = index)}
                        >
                          <span>${this.getTicketTypeIcon(ticket.type)}</span>
                          <div class="multi-select-option-info">
                            <span class="multi-select-option-name">${ticket.title}</span>
                            <span class="multi-select-option-login">${ticket.id}</span>
                          </div>
                        </div>
                      `,
                    )
                  : html` <div class="multi-select-no-results">${msg('No results')}</div> `}
              </div>
            `
          : ''}
      </div>
    `;
  }

  // Image upload methods
  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragover = true;
  }

  private handleDragLeave() {
    this.dragover = false;
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragover = false;

    const files = e.dataTransfer?.files;
    if (files) {
      this.handleImageFiles(Array.from(files));
    }
  }

  private handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      this.handleImageFiles(Array.from(input.files));
      input.value = ''; // Reset to allow re-upload of same file
    }
  }

  private async handleImageFiles(files: File[]) {
    // Only handle images in edit mode (ticket must exist)
    if (!this.isEditing || !this.ticket || !this.repository || !this.token) {
      this.uploadError = "Les images ne peuvent être ajoutées qu'à un ticket existant";
      return;
    }

    const imageFiles = files.filter(f => isValidImageExtension(f.name));

    if (imageFiles.length === 0) {
      this.uploadError = 'Seuls les fichiers images sont acceptés (jpg, png, gif, webp, svg)';
      return;
    }

    this.uploadingImages = true;
    this.uploadError = null;

    const [owner, repo] = this.repository.full_name.split('/');
    const newImages: string[] = [...(this.formData.images || [])];

    for (const file of imageFiles) {
      try {
        const imageName = await uploadImage(
          owner,
          repo,
          this.ticket.id,
          file,
          this.token,
          this.repository.default_branch,
        );
        newImages.push(imageName);

        // Load the image data URL immediately after upload
        try {
          const dataUrl = await getImageAsDataUrl(
            owner,
            repo,
            this.ticket.id,
            imageName,
            this.token,
            this.repository.default_branch,
          );
          this.imageDataUrls = new Map([...this.imageDataUrls, [imageName, dataUrl]]);
        } catch (loadError) {
          console.error('Failed to load uploaded image:', loadError);
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        this.uploadError = `${msg('Upload error:')} ${error instanceof Error ? error.message : msg('Unknown error')}`;
      }
    }

    this.formData = { ...this.formData, images: newImages };
    this.uploadingImages = false;
  }

  private async handleDeleteImage(imageName: string) {
    if (!this.isEditing || !this.ticket || !this.repository || !this.token) {
      return;
    }

    this.deletingImages = new Set([...this.deletingImages, imageName]);
    this.uploadError = null;

    const [owner, repo] = this.repository.full_name.split('/');

    try {
      await deleteImage(owner, repo, this.ticket.id, imageName, this.token, this.repository.default_branch);

      const newImages = (this.formData.images || []).filter(img => img !== imageName);
      this.formData = { ...this.formData, images: newImages };
    } catch (error) {
      console.error('Failed to delete image:', error);
      this.uploadError = `${msg('Delete error:')} ${error instanceof Error ? error.message : msg('Unknown error')}`;
    }

    this.deletingImages = new Set([...this.deletingImages].filter(img => img !== imageName));
  }

  private getImageSrc(imageName: string): string {
    return this.imageDataUrls.get(imageName) || '';
  }

  private isImageLoading(imageName: string): boolean {
    return this.loadingImages.has(imageName);
  }

  private renderImageSection() {
    // Only show image upload for existing tickets
    if (!this.isEditing) {
      return html`
        <div class="form-section">
          <h2 class="section-title">${msg('Images')}</h2>
          <div
            class="hint"
            style="padding: var(--space-md); background: var(--color-bg-secondary); border-radius: var(--radius-md);"
          >
            💡 ${msg('Save the ticket first to add images.')}
          </div>
        </div>
      `;
    }

    const images = this.formData.images || [];

    return html`
      <div class="form-section">
        <h2 class="section-title">${msg('Images')}</h2>

        <div
          class="image-upload-zone ${this.dragover ? 'dragover' : ''} ${this.uploadingImages ? 'uploading' : ''}"
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
          @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('#image-input')?.click()}
        >
          <div class="upload-icon">📷</div>
          <div class="upload-text">
            ${this.uploadingImages ? msg('Uploading...') : msg('Click or drag images here')}
          </div>
          <div class="upload-hint">${msg('Accepted formats: JPG, PNG, GIF, WebP, SVG')}</div>
          <input
            id="image-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            multiple
            hidden
            @change=${this.handleFileInput}
          />
        </div>

        ${this.uploadError ? html` <div class="upload-error">${this.uploadError}</div> ` : ''}
        ${images.length > 0
          ? html`
              <div class="image-grid">
                ${images.map(imageName => {
                  const src = this.getImageSrc(imageName);
                  const isLoading = this.isImageLoading(imageName);
                  const isDeleting = this.deletingImages.has(imageName);

                  return html`
                    <div class="image-item ${isDeleting ? 'deleting' : ''} ${isLoading ? 'loading' : ''}">
                      ${isLoading
                        ? html` <div class="image-loading">${msg('Loading image...')}</div> `
                        : src
                          ? html` <img src=${src} alt=${imageName} /> `
                          : html` <div class="image-error">${msg('Error')}</div> `}
                      <button
                        class="delete-btn"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.handleDeleteImage(imageName);
                        }}
                        ?disabled=${isDeleting}
                        title=${msg('Delete image')}
                      >
                        ✕
                      </button>
                    </div>
                  `;
                })}
              </div>
            `
          : ''}
      </div>
    `;
  }

  render() {
    const statusOptions = this.getStatusOptions();

    return html`
      <div class="page-header">
        <button class="btn-back" @click=${this.handleBack}>
          <span>←</span>
          <span>${msg('Back')}</span>
        </button>

        <div class="header-title">
          <h1>${this.isEditing ? msg('Edit ticket') : msg('New ticket')}</h1>
        </div>

        <div class="header-actions">
          <button class="btn-cancel" @click=${this.handleBack}>${msg('Cancel')}</button>
          <button
            class="btn-save"
            @click=${this.handleSave}
            ?disabled=${this.saving || Object.keys(this.errors).length > 0}
          >
            ${this.saving ? msg('Saving...') : this.isEditing ? msg('Save') : msg('Create')}
          </button>
        </div>
      </div>

      <div class="page-content">
        <div class="form-section">
          <div class="field">
            <label for="title">${msg('Title')} <span class="required">*</span></label>
            <input
              id="title"
              type="text"
              class="title-input ${this.errors.title && this.touched.title ? 'error' : ''}"
              placeholder=${msg('Title')}
              .value=${this.formData.title || ''}
              @input=${(e: Event) => this.handleTitleChange((e.target as HTMLInputElement).value)}
            />
            ${this.errors.title && this.touched.title
              ? html` <div class="error-message">${this.errors.title}</div> `
              : ''}
          </div>

          ${!this.isEditing
            ? html`
                <div class="field">
                  <label for="id">${msg('Identifier')} <span class="required">*</span></label>
                  <input
                    id="id"
                    type="text"
                    class="${this.errors.id && this.touched.id ? 'error' : ''}"
                    placeholder="my-ticket"
                    .value=${this.formData.id || ''}
                    @input=${(e: Event) => {
                      this.touched = { ...this.touched, id: true };
                      this.handleFieldChange('id', (e.target as HTMLInputElement).value);
                    }}
                  />
                  <div class="hint">${msg('Used as filename. Lowercase letters, numbers and hyphens only.')}</div>
                  ${this.errors.id && this.touched.id ? html` <div class="error-message">${this.errors.id}</div> ` : ''}
                </div>
              `
            : ''}
        </div>

        <div class="form-section">
          <h2 class="section-title">${msg('Classification')}</h2>

          <div class="field-row">
            <div class="field">
              <label for="type">${msg('Type')}</label>
              <select
                id="type"
                .value=${this.formData.type || 'task'}
                @change=${(e: Event) =>
                  this.handleFieldChange('type', (e.target as HTMLSelectElement).value as TicketTypeId)}
              >
                <option value="epic">🎯 ${msg('Epic')}</option>
                <option value="story">📖 ${msg('Story')}</option>
                <option value="bug">🐛 ${msg('Bug')}</option>
                <option value="task">✅ ${msg('Task')}</option>
              </select>
            </div>

            <div class="field">
              <label for="status">${msg('Status')}</label>
              <select
                id="status"
                .value=${this.formData.status || 'backlog'}
                @change=${(e: Event) => this.handleFieldChange('status', (e.target as HTMLSelectElement).value)}
              >
                ${statusOptions.map(status => html` <option value=${status}>${status}</option> `)}
              </select>
            </div>
          </div>

          <div class="field-row-3">
            <div class="field">
              <label for="priority">${msg('Priority')}</label>
              <select
                id="priority"
                .value=${this.formData.priority || ''}
                @change=${(e: Event) =>
                  this.handleFieldChange('priority', (e.target as HTMLSelectElement).value || undefined)}
              >
                <option value="">${msg('None')}</option>
                <option value="low">${msg('Low')}</option>
                <option value="medium">${msg('Medium')}</option>
                <option value="high">${msg('High')}</option>
                <option value="critical">${msg('Critical')}</option>
              </select>
            </div>

            <div class="field">
              <label for="version">${msg('Version')}</label>
              <select
                id="version"
                .value=${this.formData.version || ''}
                @change=${(e: Event) =>
                  this.handleFieldChange('version', (e.target as HTMLSelectElement).value || undefined)}
              >
                <option value="">${msg('No version (Backlog)')}</option>
                ${(this.config?.versions || []).map(v => html` <option value=${v.id}>${v.name}</option> `)}
              </select>
            </div>

            <div class="field">
              <label for="estimate">${msg('Estimation (points)')}</label>
              <input
                id="estimate"
                type="number"
                min="0"
                .value=${String(this.formData.estimate || '')}
                @input=${(e: Event) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  this.handleFieldChange('estimate', isNaN(val) ? undefined : val);
                }}
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">${msg('Details')}</h2>

          <div class="field">
            <label>${msg('Assignees')}</label>
            ${this.renderAssigneesField()}
          </div>

          <div class="field">
            <label for="labels">${msg('Labels')}</label>
            <input
              id="labels"
              type="text"
              placeholder="frontend, urgent"
              .value=${(this.formData.labels || []).join(', ')}
              @input=${(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                const labels = val
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean);
                this.handleFieldChange('labels', labels.length ? labels : undefined);
              }}
            />
            <div class="hint">${msg('Labels separated by commas')}</div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="dueDate">${msg('Due date')}</label>
              <input
                id="dueDate"
                type="date"
                .value=${this.formData.dueDate?.split('T')[0] || ''}
                @input=${(e: Event) => {
                  const val = (e.target as HTMLInputElement).value;
                  this.handleFieldChange('dueDate', val || undefined);
                }}
              />
            </div>

            <div class="field">
              <label>${msg('Parent ticket')}</label>
              ${this.renderParentField()}
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">${msg('Description')}</h2>

          <div class="field">
            <label for="description">${msg('Description (Markdown)')}</label>
            <textarea
              id="description"
              placeholder=${msg('Describe the ticket in detail...')}
              .value=${this.formData.description || ''}
              @input=${(e: Event) => this.handleFieldChange('description', (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
        </div>

        ${this.renderImageSection()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-ticket-form': KabaneTicketForm;
  }
}
