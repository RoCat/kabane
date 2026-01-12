/**
 * Kanban Board Component
 *
 * Main board view displaying tickets in columns based on status.
 * Handles drag-and-drop between columns and ticket updates.
 *
 * Layout:
 * - Backlog column (always visible, shows tickets without version)
 * - Version columns (filtered by selected version)
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { themeStyles, resetStyles } from '../styles';
import type { Ticket, KanbanColumn, KabaneConfig } from '../types';
import { BACKLOG_COLUMN } from '../utils/parser';
import './kabane-column';
import { msg } from '@lit/localize';

@customElement('kabane-board')
export class KabaneBoard extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }

      .board {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-lg);
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .board-section {
        display: flex;
        gap: var(--space-md);
      }

      .board-divider {
        width: 2px;
        background: var(--color-border-default);
        margin: 0 var(--space-sm);
        border-radius: 1px;
        opacity: 0.5;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-text-secondary);
        font-size: var(--font-size-md);
      }

      .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: var(--space-xl);
        text-align: center;
      }

      .error-message {
        background: rgba(218, 54, 51, 0.1);
        border: 1px solid var(--color-accent-danger);
        border-radius: var(--radius-md);
        color: var(--color-accent-danger);
        padding: var(--space-lg);
        max-width: 500px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: var(--space-xl);
        text-align: center;
        color: var(--color-text-secondary);
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: var(--space-md);
      }

      .empty-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 var(--space-sm);
      }

      .empty-description {
        max-width: 400px;
        line-height: 1.6;
      }

      .version-bar {
        background: var(--color-bg-secondary);
        padding: var(--space-sm) var(--space-lg);
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .btn-new-ticket {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--color-accent-success);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        padding: var(--space-sm) var(--space-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
        margin-left: auto;
      }

      .btn-new-ticket:hover {
        opacity: 0.9;
      }
    `,
  ];

  @property({ type: Array })
  tickets: Ticket[] = [];

  @property({ type: Object })
  config: KabaneConfig | null = null;

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  error: string | null = null;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: String })
  selectedVersionId: string | null = null;

  /**
   * Get default columns if none configured
   */
  private getDefaultColumns(): KanbanColumn[] {
    return [
      { id: 'todo', name: 'To Do', statuses: ['todo', 'ready'], color: '#58a6ff' },
      { id: 'in-progress', name: 'In Progress', statuses: ['in-progress', 'doing'], color: '#d29922' },
      { id: 'review', name: 'Review', statuses: ['review', 'testing'], color: '#a371f7' },
      { id: 'done', name: 'Done', statuses: ['done', 'closed', 'completed'], color: '#3fb950' },
    ];
  }

  /**
   * Get tickets for the Backlog column
   * Backlog shows tickets that:
   * - Have status 'backlog' AND
   * - Have no version assigned
   */
  private getBacklogTickets(): Ticket[] {
    return this.tickets.filter(
      ticket => BACKLOG_COLUMN.statuses.includes(ticket.status.toLowerCase()) && !ticket.version,
    );
  }

  /**
   * Get tickets for a specific column in the version section
   * Filters by:
   * - Status matching the column
   * - If a version is selected: only tickets from that version
   * - If no version selected: all tickets except backlog (which have a version)
   */
  private getColumnTickets(column: KanbanColumn): Ticket[] {
    return this.tickets.filter(ticket => {
      // Must match column status
      if (!column.statuses.includes(ticket.status.toLowerCase())) {
        return false;
      }

      // If viewing a specific version, only show tickets from that version
      if (this.selectedVersionId) {
        return ticket.version === this.selectedVersionId;
      }

      // If viewing all versions, show all tickets (that have a version)
      // Backlog tickets (without version) are shown in the backlog column
      return true;
    });
  }

  /**
   * Handle ticket move between columns
   */
  private handleTicketMove(e: CustomEvent) {
    const { ticketId, toStatus, toVersion } = e.detail;

    // Find the ticket
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const changes: Partial<Ticket> = {};

    // Update status if changed
    if (ticket.status.toLowerCase() !== toStatus.toLowerCase()) {
      changes.status = toStatus;
    }

    // Update version if moving to/from backlog
    if (toVersion !== undefined && ticket.version !== toVersion) {
      changes.version = toVersion || undefined;
    }

    // Don't emit if nothing changed
    if (Object.keys(changes).length === 0) return;

    // Emit event for parent to handle the update
    this.dispatchEvent(
      new CustomEvent('ticket-update', {
        detail: {
          ticket,
          changes,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (this.loading) {
      return html` <div class="loading">Loading tickets...</div> `;
    }

    if (this.error) {
      return html`
        <div class="error">
          <div class="error-message">
            <strong>Error loading board</strong><br />
            ${this.error}
          </div>
        </div>
      `;
    }

    const columns = this.config?.columns || this.getDefaultColumns();
    const backlogTickets = this.getBacklogTickets();

    return html`
      <div class="version-bar">
        <kabane-version-selector
          .versions=${this.config?.versions || []}
          .selectedVersionId=${this.selectedVersionId}
          ?disabled=${this.readonly}
        ></kabane-version-selector>

        ${!this.readonly
          ? html`
              <button class="btn-new-ticket" @click=${() => this.dispatchEvent(new CustomEvent('ticket-create'))}>
                <span>+</span>
                <span>${msg('New ticket')}</span>
              </button>
            `
          : ''}
      </div>
      <div class="board" @ticket-move=${this.handleTicketMove}>
        <!-- Backlog column (always visible) -->
        <div class="board-section">
          <kabane-column
            .column=${BACKLOG_COLUMN}
            .tickets=${backlogTickets}
            .allTickets=${this.tickets}
            ?readonly=${this.readonly}
            isBacklog
          ></kabane-column>
        </div>

        <div class="board-divider"></div>

        <!-- Version columns -->
        <div class="board-section">
          ${columns.map(
            column => html`
              <kabane-column
                .column=${column}
                .tickets=${this.getColumnTickets(column)}
                .allTickets=${this.tickets}
                ?readonly=${this.readonly}
                .targetVersion=${this.selectedVersionId}
              ></kabane-column>
            `,
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-board': KabaneBoard;
  }
}
