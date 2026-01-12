/**
 * Ticket Card Component
 *
 * Displays a single ticket in the Kanban board.
 * Supports drag-and-drop for moving between columns.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { themeStyles, resetStyles, badgeStyles } from '../styles';
import type { Ticket } from '../types';

@customElement('kabane-ticket-card')
export class KabaneTicketCard extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    badgeStyles,
    css`
      :host {
        display: block;
      }

      .card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        cursor: grab;
        transition: all var(--transition-fast);
      }

      .card:hover {
        border-color: var(--color-border-muted);
        box-shadow: var(--shadow-sm);
      }

      .card.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      .card.read-only {
        cursor: default;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
      }

      .title {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-text-primary);
        margin: 0;
        line-height: 1.4;
        word-break: break-word;
      }

      .type-icon {
        font-size: 14px;
        flex-shrink: 0;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
        margin-top: var(--space-sm);
        align-items: center;
      }

      .ticket-id {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .assignees {
        display: flex;
        margin-top: var(--space-sm);
      }

      .assignee {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid var(--color-bg-secondary);
        margin-left: -8px;
        background: var(--color-bg-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .assignee:first-child {
        margin-left: 0;
      }

      .labels {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: var(--space-sm);
      }

      .label {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 10px;
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
      }

      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: var(--space-sm);
        padding-top: var(--space-sm);
        border-top: 1px solid var(--color-border-muted);
      }

      .estimate {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .due-date {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .due-date.overdue {
        color: var(--color-accent-danger);
      }

      .card-actions {
        position: absolute;
        bottom: var(--space-sm);
        right: var(--space-sm);
        display: none;
        gap: var(--space-xs);
      }

      .card:hover .card-actions {
        display: flex;
      }

      .btn-card-action {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-sm);
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        padding: 0;
      }

      .btn-card-action:hover {
        background: var(--color-bg-tertiary);
        border-color: var(--color-border-hover);
      }

      .card {
        position: relative;
      }
    `,
  ];

  @property({ type: Object })
  ticket!: Ticket;

  @property({ type: Boolean })
  readonly = false;

  @state()
  private dragging = false;

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      epic: '⚡',
      story: '📖',
      bug: '🐛',
      task: '✅',
    };
    return icons[type] || '📌';
  }

  private handleDragStart(e: DragEvent) {
    if (this.readonly) {
      e.preventDefault();
      return;
    }

    this.dragging = true;
    e.dataTransfer?.setData('text/plain', this.ticket.id);
    e.dataTransfer!.effectAllowed = 'move';

    // Emit event for parent to track dragging state
    this.dispatchEvent(
      new CustomEvent('drag-start', {
        detail: { ticketId: this.ticket.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDragEnd() {
    this.dragging = false;
    this.dispatchEvent(
      new CustomEvent('drag-end', {
        detail: { ticketId: this.ticket.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent('ticket-click', {
        detail: { ticket: this.ticket },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleEdit(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('ticket-edit', {
        detail: { ticket: this.ticket },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private formatDueDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `${diffDays}d left`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  render() {
    const cardClasses = {
      card: true,
      dragging: this.dragging,
      'read-only': this.readonly,
    };

    return html`
      <article
        class=${classMap(cardClasses)}
        draggable=${!this.readonly}
        @dragstart=${this.handleDragStart}
        @dragend=${this.handleDragEnd}
        @click=${this.handleClick}
      >
        ${!this.readonly
          ? html`
              <div class="card-actions">
                <button class="btn-card-action" title="Modifier" @click=${this.handleEdit}>✏️</button>
              </div>
            `
          : ''}

        <div class="card-header">
          <h3 class="title">${this.ticket.title}</h3>
          <span class="type-icon" title=${this.ticket.type}> ${this.getTypeIcon(this.ticket.type)} </span>
        </div>

        <div class="meta">
          <span class="ticket-id">#${this.ticket.id}</span>
          <span class="badge badge-${this.ticket.type}">${this.ticket.type}</span>
          ${this.ticket.priority
            ? html` <span class="badge badge-priority-${this.ticket.priority}"> ${this.ticket.priority} </span> `
            : ''}
        </div>

        ${this.ticket.labels?.length
          ? html`
              <div class="labels">${this.ticket.labels.map(label => html` <span class="label">${label}</span> `)}</div>
            `
          : ''}
        ${this.ticket.estimate || this.ticket.dueDate || this.ticket.assignees?.length
          ? html`
              <div class="footer">
                <div>
                  ${this.ticket.estimate
                    ? html`
                        <span class="estimate">
                          <span>⏱</span>
                          ${this.ticket.estimate}pts
                        </span>
                      `
                    : ''}
                </div>

                ${this.ticket.dueDate
                  ? html`
                      <span class="due-date ${this.isOverdue(this.ticket.dueDate) ? 'overdue' : ''}">
                        ${this.formatDueDate(this.ticket.dueDate)}
                      </span>
                    `
                  : ''}
                ${this.ticket.assignees?.length
                  ? html`
                      <div class="assignees">
                        ${this.ticket.assignees
                          .slice(0, 3)
                          .map(
                            assignee => html`
                              <span class="assignee" title=${assignee}> ${assignee.charAt(0).toUpperCase()} </span>
                            `,
                          )}
                        ${this.ticket.assignees.length > 3
                          ? html` <span class="assignee">+${this.ticket.assignees.length - 3}</span> `
                          : ''}
                      </div>
                    `
                  : ''}
              </div>
            `
          : ''}
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-ticket-card': KabaneTicketCard;
  }
}
