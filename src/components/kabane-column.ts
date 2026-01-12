/**
 * Kanban Column Component
 *
 * A single column in the Kanban board.
 * Handles drag-and-drop target for tickets.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { themeStyles, resetStyles } from '../styles';
import type { Ticket, KanbanColumn } from '../types';
import './kabane-ticket-card';

@customElement('kabane-column')
export class KabaneColumnComponent extends LitElement {
  static styles = [
    themeStyles,
    resetStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-width: 300px;
        max-width: 350px;
        flex: 1;
        background: var(--color-bg-canvas);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .column-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md);
        background: var(--color-bg-secondary);
        border-bottom: 1px solid var(--color-border-default);
      }

      .column-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .column-title h2 {
        font-size: var(--font-size-sm);
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
      }

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--column-color, var(--color-text-muted));
      }

      .ticket-count {
        background: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
        font-size: var(--font-size-xs);
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 10px;
      }

      .column-body {
        flex: 1;
        padding: var(--space-sm);
        overflow-y: auto;
        min-height: 200px;
        transition: background var(--transition-fast);
      }

      .column-body.drag-over {
        background: rgba(31, 111, 235, 0.1);
      }

      .tickets {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .drop-hint {
        border: 2px dashed var(--color-border-default);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        text-align: center;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      .column-body.drag-over .drop-hint {
        opacity: 1;
      }
    `,
  ];

  @property({ type: Object })
  column!: KanbanColumn;

  @property({ type: Array })
  tickets: Ticket[] = [];

  @property({ type: Array })
  allTickets: Ticket[] = [];

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Boolean })
  isBacklog = false;

  @property({ type: String })
  targetVersion: string | null = null;

  @state()
  private dragOver = false;

  private handleDragOver(e: DragEvent) {
    if (this.readonly) return;

    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.dragOver = true;
  }

  private handleDragLeave(e: DragEvent) {
    // Only set dragOver to false if we're leaving the column-body itself
    // not when entering a child element
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    this.dragOver = false;
  }

  private handleDrop(e: DragEvent) {
    if (this.readonly) return;

    e.preventDefault();
    this.dragOver = false;

    const ticketId = e.dataTransfer?.getData('text/plain');
    if (!ticketId) return;

    // get ticket being moved
    const ticket = this.allTickets.find(t => t.id === ticketId);
    console.log('Dropped ticket:', ticket?.id, 'into column:', this.column.id);
    if (!ticket) return;

    // Get the first status of this column as the target status
    const targetStatus = this.column.statuses[0];

    // When dropping in backlog, remove version
    // When dropping in version columns, assign the selected version
    const toVersion = this.isBacklog ? null : this.targetVersion || ticket.version;

    this.dispatchEvent(
      new CustomEvent('ticket-move', {
        detail: {
          ticketId,
          toStatus: targetStatus,
          toVersion,
          columnId: this.column.id,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const bodyClasses = {
      'column-body': true,
      'drag-over': this.dragOver,
    };

    return html`
      <div class="column-header">
        <div class="column-title">
          <span class="color-dot" style="--column-color: ${this.column.color || 'var(--color-text-muted)'}"></span>
          <h2>${this.column.name}</h2>
        </div>
        <span class="ticket-count">${this.tickets.length}</span>
      </div>

      <div
        class=${classMap(bodyClasses)}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        ${this.tickets.length > 0
          ? html`
              <div class="tickets">
                ${this.tickets.map(
                  ticket => html`
                    <kabane-ticket-card .ticket=${ticket} ?readonly=${this.readonly}></kabane-ticket-card>
                  `,
                )}
              </div>
            `
          : html`
              <div class="empty-state">
                ${this.dragOver
                  ? html` <div class="drop-hint">Drop ticket here</div> `
                  : html` <span>No tickets</span> `}
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kabane-column': KabaneColumnComponent;
  }
}
