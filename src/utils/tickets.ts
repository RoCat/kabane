import localConfig from './localConfig';
import { msg } from '@lit/localize';
import { notifications } from './notifications';
import { parseRepoFullName, updateTicket, GitHubAPIError, createTicket, loadTickets } from '../api';
import { Ticket } from '@/types';
import { appMobx } from './app-mobx';
import { makeAutoObservable } from 'mobx';

export class TicketManager {
  public tickets: Ticket[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  public clear() {
    this.tickets = [];
  }

  public async loadTickets() {
    const token = appMobx.token;
    const { owner, repo } = parseRepoFullName(localConfig.repository);
    const branch = localConfig.defaultBranch || appMobx.repository?.default_branch;
    if (token && owner && repo && branch) {
      this.tickets = await loadTickets(owner, repo, token, branch);
    } else {
      this.tickets = [];
      notifications.showToast(msg('Failed to load tickets: Missing authentication or repository information'), 'error');
    }
  }

  public async updateTicket(ticket: Ticket, changes: Partial<Ticket>) {
    if (!appMobx.canEdit) {
      notifications.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = appMobx.token;
    if (!token || !localConfig) return;

    appMobx.setLoading(true);

    try {
      // Create updated ticket
      const updatedTicket: Ticket = {
        ...ticket,
        ...changes,
      };

      // Commit to GitHub
      const { owner, repo } = parseRepoFullName(localConfig.repository);
      const branch = localConfig.defaultBranch || appMobx.repository?.default_branch;

      const result = await updateTicket(owner, repo, updatedTicket, token, branch);

      this.tickets = this.tickets.map(t => (t.id === ticket.id ? result : t));

      notifications.showToast(msg('Ticket updated successfully'), 'success');
    } catch (err) {
      console.error('Failed to update ticket:', err);

      if (err instanceof GitHubAPIError && err.isConflict) {
        notifications.showToast(msg('Conflict: The file has been modified. Please refresh.'), 'error');
      } else {
        notifications.showToast(err instanceof Error ? err.message : msg('Failed to update ticket'), 'error');
      }
    } finally {
      appMobx.setLoading(false);
    }
  }

  public async createTicket(ticket: Ticket) {
    if (!appMobx.canEdit) {
      notifications.showToast(msg('You do not have permission to edit this repository'), 'error');
      return;
    }

    const token = appMobx.token;
    if (!token || !localConfig) return;

    appMobx.setLoading(true);

    try {
      const { owner, repo } = parseRepoFullName(localConfig.repository);
      const branch = localConfig.defaultBranch || appMobx.repository?.default_branch;

      const newTicket = await createTicket(owner, repo, ticket, token, branch);

      this.tickets = [...this.tickets, newTicket];
      notifications.showToast(msg('Ticket created successfully'), 'success');
    } catch (err) {
      console.error('Failed to create ticket:', err);
      notifications.showToast(err instanceof Error ? err.message : msg('Failed to create ticket'), 'error');
    } finally {
      appMobx.setLoading(false);
    }
  }
}

const ticketManager = new TicketManager();
(window as any).ticketManager = ticketManager; // Expose for debugging
export default ticketManager;
