/**
 * Core type definitions for Kabane
 * These types define the data structures used throughout the application
 */

// ============================================================================
// Local Configuration (kabane.config.json in deployment)
// ============================================================================

/**
 * Local configuration stored alongside the deployed app
 * This only contains the target repository - all other config is in the repo itself
 */
export interface LocalConfig {
  /** Repository where tickets are stored (format: owner/repo) */
  repository: string;
  /** Default branch to use (default: main) */
  defaultBranch?: string;
}

// ============================================================================
// Remote Configuration (stored in target repo's .kabane/ folder)
// ============================================================================

/**
 * Full Kabane configuration loaded from target repository
 * Structure in repo:
 * .kabane/
 *   columns.yml      - Kanban column definitions
 *   ticketTypes.yml  - Ticket type definitions
 *   versions.yml     - Version/sprint definitions
 *   tickets/
 *     <id>.yml       - Individual ticket files
 */
export interface KabaneConfig {
  /** Kanban column definitions (from .kabane/columns.yml) */
  columns: KanbanColumn[];
  /** Ticket type definitions (from .kabane/ticketTypes.yml) */
  ticketTypes: TicketType[];
  /** Version/sprint definitions (from .kabane/versions.yml) */
  versions: Version[];
}

export interface KanbanColumn {
  /** Unique identifier for the column */
  id: string;
  /** Display name */
  name: string;
  /** Status values that map to this column */
  statuses: string[];
  /** Optional color for the column header */
  color?: string;
}

export interface TicketType {
  /** Type identifier (epic, story, bug, task) */
  id: string;
  /** Display name */
  name: string;
  /** Emoji or icon */
  icon?: string;
  /** Color for badges */
  color?: string;
}

// ============================================================================
// Version Types
// ============================================================================

/**
 * A version/sprint for organizing tickets
 */
export interface Version {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "v1.0", "Sprint 1") */
  name: string;
  /** Start date (ISO string) */
  startDate?: string;
  /** Estimated delivery date (ISO string) */
  targetDate?: string;
  /** Creation date */
  createdAt?: string;
}

/**
 * Raw version data as stored in YAML file
 */
export interface VersionYaml {
  id: string;
  name: string;
  startDate?: string;
  targetDate?: string;
  createdAt?: string;
}

// ============================================================================
// Ticket Types
// ============================================================================

/**
 * A ticket parsed from a YAML file in .kabane/tickets/<id>.yml
 */
export interface Ticket {
  /** Unique ID (filename without .yml extension) */
  id: string;
  /** File path relative to repo root */
  path: string;
  /** Git SHA of the file (for conflict detection) */
  sha: string;
  /** Ticket title */
  title: string;
  /** Ticket type (epic, story, bug, task) */
  type: TicketTypeId;
  /** Current status */
  status: string;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Assigned users (GitHub usernames) */
  assignees?: string[];
  /** Labels/tags */
  labels?: string[];
  /** Parent ticket ID (for hierarchy) */
  parent?: string;
  /** Version ID this ticket belongs to (null = backlog) */
  version?: string;
  /** Estimated effort/points */
  estimate?: number;
  /** Due date (ISO string) */
  dueDate?: string;
  /** Description/body content (markdown) */
  description?: string;
  /** Attached images (filenames in .kabane/images/<ticket_id>/) */
  images?: string[];
  /** Last modified date */
  updatedAt?: string;
  /** Created date */
  createdAt?: string;
}

export type TicketTypeId = 'epic' | 'story' | 'bug' | 'task' | string;

/**
 * Raw ticket data as stored in YAML file
 */
export interface TicketYaml {
  title: string;
  type: TicketTypeId;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignees?: string[];
  labels?: string[];
  parent?: string;
  version?: string;
  estimate?: number;
  dueDate?: string;
  description?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// GitHub API Types
// ============================================================================

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubRepository {
  id: number;
  owner: GitHubUser;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  download_url: string | null;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// ============================================================================
// Application State Types
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  /** Token is kept in memory only, never persisted */
  accessToken: string | null;
}

export interface AppState {
  auth: AuthState;
  localConfig: LocalConfig | null;
  config: KabaneConfig | null;
  repository: GitHubRepository | null;
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  /** Whether user has write access to the repo */
  canEdit: boolean;
  /** Whether the target repo has been initialized with .kabane folder */
  isInitialized: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface TicketMoveEvent {
  ticketId: string;
  fromStatus: string;
  toStatus: string;
}

export interface TicketUpdateEvent {
  ticket: Ticket;
  changes: Partial<Ticket>;
}
