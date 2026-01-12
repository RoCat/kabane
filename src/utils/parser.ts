/**
 * YAML Parser for Kabane
 *
 * Parses YAML files for:
 * - columns.yml: Kanban column definitions
 * - ticketTypes.yml: Ticket type definitions
 * - versions.yml: Version/sprint definitions
 * - tickets/<id>.yml: Individual ticket files
 */

import YAML from 'yaml';
import type { Ticket, TicketYaml, KanbanColumn, TicketType, Version, VersionYaml, KabaneConfig } from '../types';

// ============================================================================
// YAML Parsing Functions
// ============================================================================

/**
 * Parse YAML content safely
 */
export function parseYaml<T>(content: string): T {
  try {
    return YAML.parse(content) as T;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    throw new Error('Invalid YAML format');
  }
}

/**
 * Serialize object to YAML
 */
export function serializeYaml(data: unknown): string {
  return YAML.stringify(data, {
    indent: 2,
    lineWidth: 0, // Don't wrap lines
  });
}

// ============================================================================
// Column Parsing
// ============================================================================

/**
 * Parse columns.yml content
 */
export function parseColumnsFile(content: string): KanbanColumn[] {
  const data = parseYaml<{ columns: KanbanColumn[] } | KanbanColumn[]>(content);

  // Support both { columns: [...] } and direct array format
  const columns = Array.isArray(data) ? data : data.columns;

  if (!Array.isArray(columns)) {
    throw new Error('columns.yml must contain an array of columns');
  }

  return columns.map(col => ({
    id: col.id,
    name: col.name,
    statuses: Array.isArray(col.statuses) ? col.statuses : [col.id],
    color: col.color,
  }));
}

/**
 * Serialize columns to YAML
 */
export function serializeColumnsFile(columns: KanbanColumn[]): string {
  return serializeYaml({ columns });
}

// ============================================================================
// Ticket Types Parsing
// ============================================================================

/**
 * Parse ticketTypes.yml content
 */
export function parseTicketTypesFile(content: string): TicketType[] {
  const data = parseYaml<{ ticketTypes: TicketType[] } | TicketType[]>(content);

  // Support both { ticketTypes: [...] } and direct array format
  const types = Array.isArray(data) ? data : data.ticketTypes;

  if (!Array.isArray(types)) {
    throw new Error('ticketTypes.yml must contain an array of ticket types');
  }

  return types.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
  }));
}

/**
 * Serialize ticket types to YAML
 */
export function serializeTicketTypesFile(types: TicketType[]): string {
  return serializeYaml({ ticketTypes: types });
}

// ============================================================================
// Version Parsing
// ============================================================================

/**
 * Parse versions.yml content
 */
export function parseVersionsFile(content: string): Version[] {
  const data = parseYaml<{ versions: VersionYaml[] } | VersionYaml[]>(content);

  // Support both { versions: [...] } and direct array format
  const versions = Array.isArray(data) ? data : data.versions;

  if (!Array.isArray(versions)) {
    throw new Error('versions.yml must contain an array of versions');
  }

  return versions.map(v => ({
    id: v.id,
    name: v.name,
    startDate: v.startDate,
    targetDate: v.targetDate,
    createdAt: v.createdAt,
  }));
}

/**
 * Serialize versions to YAML
 */
export function serializeVersionsFile(versions: Version[]): string {
  return serializeYaml({ versions });
}

/**
 * Serialize a single version to YAML (for creating/updating)
 */
export function serializeVersion(version: Version): VersionYaml {
  return {
    id: version.id,
    name: version.name,
    startDate: version.startDate,
    targetDate: version.targetDate,
    createdAt: version.createdAt,
  };
}

// ============================================================================
// Ticket Parsing
// ============================================================================

/**
 * Parse a ticket YAML file into a Ticket object
 */
export function parseTicketFile(content: string, path: string, sha: string): Ticket {
  const data = parseYaml<TicketYaml>(content);

  // Extract ID from filename (e.g., ".kabane/tickets/123.yml" -> "123")
  const id = extractTicketId(path);

  return {
    id,
    path,
    sha,
    title: data.title || `Ticket ${id}`,
    type: data.type || 'task',
    status: data.status || 'backlog',
    priority: validatePriority(data.priority),
    assignees: normalizeArray(data.assignees),
    labels: normalizeArray(data.labels),
    parent: data.parent,
    version: data.version,
    estimate: typeof data.estimate === 'number' ? data.estimate : undefined,
    dueDate: data.dueDate,
    description: data.description,
    images: normalizeArray(data.images),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Serialize a Ticket back to YAML content
 */
export function serializeTicket(ticket: Ticket): string {
  const data: TicketYaml = {
    title: ticket.title,
    type: ticket.type,
    status: ticket.status,
  };

  // Only include optional fields if they have values
  if (ticket.priority) data.priority = ticket.priority;
  if (ticket.assignees?.length) data.assignees = ticket.assignees;
  if (ticket.labels?.length) data.labels = ticket.labels;
  if (ticket.parent) data.parent = ticket.parent;
  if (ticket.version) data.version = ticket.version;
  if (ticket.estimate !== undefined) data.estimate = ticket.estimate;
  if (ticket.dueDate) data.dueDate = ticket.dueDate;
  if (ticket.description) data.description = ticket.description;
  if (ticket.images?.length) data.images = ticket.images;
  if (ticket.createdAt) data.createdAt = ticket.createdAt;

  // Always update the updatedAt timestamp
  data.updatedAt = new Date().toISOString();

  return serializeYaml(data);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract ticket ID from file path
 * e.g., ".kabane/tickets/my-feature.yml" -> "my-feature"
 */
function extractTicketId(path: string): string {
  const filename = path.split('/').pop() || path;
  return filename.replace(/\.(yml|yaml)$/, '');
}

/**
 * Validate priority value
 */
function validatePriority(priority: unknown): Ticket['priority'] {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  return validPriorities.includes(priority as string) ? (priority as Ticket['priority']) : undefined;
}

/**
 * Normalize array fields
 */
function normalizeArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return [value];
  }
  return undefined;
}

/**
 * Check if a file is a valid ticket file
 */
export function isTicketFile(path: string): boolean {
  return (path.endsWith('.yml') || path.endsWith('.yaml')) && path.includes('.kabane/tickets/');
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * The Backlog column - always present, not stored in columns.yml
 */
export const BACKLOG_COLUMN: KanbanColumn = {
  id: 'backlog',
  name: 'Backlog',
  statuses: ['backlog'],
  color: '#8b949e',
};

/**
 * Default columns for new repositories (excluding Backlog which is hardcoded)
 */
export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'To Do', statuses: ['todo'], color: '#58a6ff' },
  { id: 'in-progress', name: 'In Progress', statuses: ['in-progress'], color: '#d29922' },
  { id: 'done', name: 'Done', statuses: ['done'], color: '#3fb950' },
];

/**
 * Default ticket types for new repositories
 */
export const DEFAULT_TICKET_TYPES: TicketType[] = [
  { id: 'epic', name: 'Epic', icon: '🎯', color: '#a371f7' },
  { id: 'story', name: 'Story', icon: '📖', color: '#58a6ff' },
  { id: 'bug', name: 'Bug', icon: '🐛', color: '#f85149' },
  { id: 'task', name: 'Task', icon: '✅', color: '#3fb950' },
];

/**
 * Default versions (empty array - versions are created by users)
 */
export const DEFAULT_VERSIONS: Version[] = [];

/**
 * Get default Kabane configuration
 */
export function getDefaultConfig(): KabaneConfig {
  return {
    columns: DEFAULT_COLUMNS,
    ticketTypes: DEFAULT_TICKET_TYPES,
    versions: DEFAULT_VERSIONS,
  };
}
