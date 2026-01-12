/**
 * GitHub API Client
 *
 * Provides type-safe wrappers around the GitHub REST API.
 * All requests use the user's access token for authentication.
 */

import type { GitHubUser, GitHubRepository, GitHubContent, GitHubTreeItem } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_API_BASE = 'https://api.github.com';

// ============================================================================
// HTTP Client
// ============================================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Make an authenticated request to the GitHub API
 */
async function githubFetch<T>(endpoint: string, token: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new GitHubAPIError(response.status, error.message || `GitHub API error: ${response.statusText}`, error);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Custom error class for GitHub API errors
 */
export class GitHubAPIError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

// ============================================================================
// User API
// ============================================================================

/**
 * Fetch the authenticated user's profile
 */
export async function fetchCurrentUser(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>('/user', token);
}

// ============================================================================
// Repository API
// ============================================================================

/**
 * Fetch a repository's details including permissions
 */
export async function fetchRepository(owner: string, repo: string, token: string): Promise<GitHubRepository> {
  return githubFetch<GitHubRepository>(`/repos/${owner}/${repo}`, token);
}

/**
 * Check if user has push access to a repository
 */
export async function checkPushAccess(owner: string, repo: string, token: string): Promise<boolean> {
  try {
    const repository = await fetchRepository(owner, repo, token);
    return repository.permissions?.push ?? false;
  } catch (error) {
    if (error instanceof GitHubAPIError && error.isForbidden) {
      return false;
    }
    throw error;
  }
}

// ============================================================================
// Contents API
// ============================================================================

/**
 * Fetch a file or directory from a repository
 */
export async function fetchContents(
  owner: string,
  repo: string,
  path: string,
  token: string,
  ref?: string,
): Promise<GitHubContent | GitHubContent[]> {
  const params = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  return githubFetch<GitHubContent | GitHubContent[]>(`/repos/${owner}/${repo}/contents/${path}${params}`, token);
}

/**
 * Fetch a single file's content (decoded from base64)
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token: string,
  ref?: string,
): Promise<{ content: string; sha: string }> {
  const response = (await fetchContents(owner, repo, path, token, ref)) as GitHubContent;

  if (response.type !== 'file') {
    throw new Error(`Expected file but got ${response.type}`);
  }

  if (!response.content) {
    throw new Error('File has no content');
  }

  // Decode base64 content
  const content = atob(response.content.replace(/\n/g, ''));

  return {
    content,
    sha: response.sha,
  };
}

/**
 * List all files in a directory recursively using Git Tree API
 * More efficient than calling contents API multiple times
 */
export async function listFilesRecursively(
  owner: string,
  repo: string,
  path: string,
  token: string,
  branch?: string,
): Promise<GitHubTreeItem[]> {
  // First, get the tree SHA for the branch
  const branchRef = branch || 'main';

  interface RefResponse {
    object: { sha: string };
  }

  const refResponse = await githubFetch<RefResponse>(`/repos/${owner}/${repo}/git/ref/heads/${branchRef}`, token);

  interface TreeResponse {
    tree: GitHubTreeItem[];
    truncated: boolean;
  }

  // Get the tree recursively
  const treeResponse = await githubFetch<TreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${refResponse.object.sha}?recursive=1`,
    token,
  );

  // Filter to only files in the specified path
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  return treeResponse.tree.filter(item => {
    if (item.type !== 'blob') return false;
    return item.path.startsWith(normalizedPath);
  });
}

// ============================================================================
// Commit API
// ============================================================================

interface CreateOrUpdateFileParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  sha?: string; // Required for updates, undefined for new files
  branch?: string;
}

interface CommitResponse {
  content: GitHubContent;
  commit: {
    sha: string;
    message: string;
    html_url: string;
  };
}

/**
 * Create or update a file in the repository
 * This creates a commit with the file change
 */
export async function createOrUpdateFile(params: CreateOrUpdateFileParams, token: string): Promise<CommitResponse> {
  const { owner, repo, path, content, message, sha, branch } = params;

  // Encode content to base64
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  const body: Record<string, unknown> = {
    message,
    content: encodedContent,
  };

  if (sha) {
    body.sha = sha;
  }

  if (branch) {
    body.branch = branch;
  }

  return githubFetch<CommitResponse>(`/repos/${owner}/${repo}/contents/${path}`, token, { method: 'PUT', body });
}

/**
 * Delete a file from the repository
 */
export async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string,
  token: string,
  branch?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    sha,
  };

  if (branch) {
    body.branch = branch;
  }

  await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, token, { method: 'DELETE', body });
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Parse owner/repo from a full repository name
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository name: ${fullName}`);
  }
  return { owner, repo };
}

// ============================================================================
// Kabane Folder API
// ============================================================================

const KABANE_FOLDER = '.kabane';
const COLUMNS_FILE = `${KABANE_FOLDER}/columns.yml`;
const TICKET_TYPES_FILE = `${KABANE_FOLDER}/ticketTypes.yml`;
const VERSIONS_FILE = `${KABANE_FOLDER}/versions.yml`;
const TICKETS_FOLDER = `${KABANE_FOLDER}/tickets`;

import {
  parseColumnsFile,
  parseTicketTypesFile,
  parseVersionsFile,
  parseTicketFile,
  serializeTicket,
  serializeColumnsFile,
  serializeTicketTypesFile,
  serializeVersionsFile,
  DEFAULT_COLUMNS,
  DEFAULT_TICKET_TYPES,
  DEFAULT_VERSIONS,
} from '../utils/parser';
import type { KabaneConfig, Ticket, KanbanColumn, TicketType, Version } from '../types';

/**
 * Check if the .kabane folder exists in the repository
 */
export async function checkKabaneFolderExists(
  owner: string,
  repo: string,
  token: string,
  branch?: string,
): Promise<boolean> {
  try {
    const params = branch ? `?ref=${encodeURIComponent(branch)}` : '';
    await githubFetch<GitHubContent>(`/repos/${owner}/${repo}/contents/${KABANE_FOLDER}${params}`, token);
    return true;
  } catch (error) {
    if (error instanceof GitHubAPIError && error.isNotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Load Kabane configuration from the target repository
 */
export async function loadKabaneConfig(
  owner: string,
  repo: string,
  token: string,
  branch?: string,
): Promise<KabaneConfig> {
  // Load columns
  let columns: KanbanColumn[] = DEFAULT_COLUMNS;
  try {
    const { content } = await fetchFileContent(owner, repo, COLUMNS_FILE, token, branch);
    columns = parseColumnsFile(content);
  } catch (error) {
    if (!(error instanceof GitHubAPIError && error.isNotFound)) {
      console.warn('Failed to load columns.yml:', error);
    }
  }

  // Load ticket types
  let ticketTypes: TicketType[] = DEFAULT_TICKET_TYPES;
  try {
    const { content } = await fetchFileContent(owner, repo, TICKET_TYPES_FILE, token, branch);
    ticketTypes = parseTicketTypesFile(content);
  } catch (error) {
    if (!(error instanceof GitHubAPIError && error.isNotFound)) {
      console.warn('Failed to load ticketTypes.yml:', error);
    }
  }

  // Load versions
  let versions: Version[] = DEFAULT_VERSIONS;
  try {
    const { content } = await fetchFileContent(owner, repo, VERSIONS_FILE, token, branch);
    versions = parseVersionsFile(content);
  } catch (error) {
    if (!(error instanceof GitHubAPIError && error.isNotFound)) {
      console.warn('Failed to load versions.yml:', error);
    }
  }

  return { columns, ticketTypes, versions };
}

/**
 * Load all tickets from the .kabane/tickets folder
 */
export async function loadTickets(owner: string, repo: string, token: string, branch?: string): Promise<Ticket[]> {
  const tickets: Ticket[] = [];

  try {
    // List all files in the tickets folder
    const files = await listFilesRecursively(owner, repo, TICKETS_FOLDER, token, branch);

    // Load each ticket file
    for (const file of files) {
      if (!file.path.endsWith('.yml') && !file.path.endsWith('.yaml')) {
        continue;
      }

      try {
        const { content, sha } = await fetchFileContent(owner, repo, file.path, token, branch);
        const ticket = parseTicketFile(content, file.path, sha);
        tickets.push(ticket);
      } catch (error) {
        console.warn(`Failed to load ticket ${file.path}:`, error);
      }
    }
  } catch (error) {
    if (error instanceof GitHubAPIError && error.isNotFound) {
      // No tickets folder yet, return empty array
      return [];
    }
    throw error;
  }

  return tickets;
}

/**
 * Load all contributors for this repository (users who have write access, then users that have forked this repo)
 */
export async function loadContributors(owner: string, repo: string, token: string): Promise<GitHubUser[]> {
  const contributors: GitHubUser[] = [];

  try {
    // get all users with write access to the repository
    const response = await githubFetch<GitHubUser[]>(`/repos/${owner}/${repo}/collaborators?permission=push`, token);
    contributors.push(...response);
    // get all users that have forked this repository
    const forksResponse = await githubFetch<GitHubRepository[]>(`/repos/${owner}/${repo}/forks`, token);
    const forkOwners = forksResponse.map(fork => fork.owner);
    contributors.push(...forkOwners);
  } catch (error) {
    if (error instanceof GitHubAPIError && error.isNotFound) {
      // No contributors found, return empty array
      return [];
    }
    throw error;
  }

  return contributors;
}

/**
 * Initialize the .kabane folder in a repository with default configuration
 */
export async function initializeKabaneFolder(
  owner: string,
  repo: string,
  token: string,
  branch?: string,
): Promise<void> {
  // Create columns.yml (without backlog - it's hardcoded)
  await createOrUpdateFile(
    {
      owner,
      repo,
      path: COLUMNS_FILE,
      content: serializeColumnsFile(DEFAULT_COLUMNS),
      message: '🎯 Initialize Kabane: Add columns.yml',
      branch,
    },
    token,
  );

  // Create ticketTypes.yml
  await createOrUpdateFile(
    {
      owner,
      repo,
      path: TICKET_TYPES_FILE,
      content: serializeTicketTypesFile(DEFAULT_TICKET_TYPES),
      message: '🎯 Initialize Kabane: Add ticketTypes.yml',
      branch,
    },
    token,
  );

  // Create versions.yml (empty by default)
  await createOrUpdateFile(
    {
      owner,
      repo,
      path: VERSIONS_FILE,
      content: serializeVersionsFile(DEFAULT_VERSIONS),
      message: '🎯 Initialize Kabane: Add versions.yml',
      branch,
    },
    token,
  );

  // Create a sample ticket to initialize the tickets folder
  const sampleTicket: Ticket = {
    id: 'welcome',
    path: `${TICKETS_FOLDER}/welcome.yml`,
    sha: '',
    title: 'Welcome to Kabane!',
    type: 'task',
    status: 'backlog',
    description:
      'This is your first ticket. Feel free to edit or delete it.\n\nKabane stores your tickets as YAML files in the `.kabane/tickets/` folder.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await createOrUpdateFile(
    {
      owner,
      repo,
      path: sampleTicket.path,
      content: serializeTicket(sampleTicket),
      message: '🎯 Initialize Kabane: Add sample ticket',
      branch,
    },
    token,
  );
}

/**
 * Create a new ticket in the repository
 */
export async function createTicket(
  owner: string,
  repo: string,
  ticket: Omit<Ticket, 'path' | 'sha'>,
  token: string,
  branch?: string,
): Promise<Ticket> {
  const path = `${TICKETS_FOLDER}/${ticket.id}.yml`;

  const fullTicket: Ticket = {
    ...ticket,
    path,
    sha: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const response = await createOrUpdateFile(
    {
      owner,
      repo,
      path,
      content: serializeTicket(fullTicket),
      message: `✨ Create ticket: ${ticket.title}`,
      branch,
    },
    token,
  );

  return {
    ...fullTicket,
    sha: response.content.sha,
  };
}

/**
 * Update an existing ticket in the repository
 */
export async function updateTicket(
  owner: string,
  repo: string,
  ticket: Ticket,
  token: string,
  branch?: string,
): Promise<Ticket> {
  const response = await createOrUpdateFile(
    {
      owner,
      repo,
      path: ticket.path,
      content: serializeTicket(ticket),
      message: `📝 Update ticket: ${ticket.title}`,
      sha: ticket.sha,
      branch,
    },
    token,
  );

  return {
    ...ticket,
    sha: response.content.sha,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a ticket from the repository
 */
export async function deleteTicketFile(
  owner: string,
  repo: string,
  ticket: Ticket,
  token: string,
  branch?: string,
): Promise<void> {
  await deleteFile(owner, repo, ticket.path, ticket.sha, `🗑️ Delete ticket: ${ticket.title}`, token, branch);
}

/**
 * Generate a unique ticket ID
 */
export function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${random}`;
}

// ============================================================================
// Version Management
// ============================================================================

/**
 * Save versions to the repository (creates or updates versions.yml)
 */
export async function saveVersions(
  owner: string,
  repo: string,
  versions: Version[],
  token: string,
  branch?: string,
): Promise<void> {
  // First, try to get the current file SHA
  let sha: string | undefined;
  try {
    const { sha: currentSha } = await fetchFileContent(owner, repo, VERSIONS_FILE, token, branch);
    sha = currentSha;
  } catch (error) {
    if (!(error instanceof GitHubAPIError && error.isNotFound)) {
      throw error;
    }
    // File doesn't exist yet, that's fine
  }

  await createOrUpdateFile(
    {
      owner,
      repo,
      path: VERSIONS_FILE,
      content: serializeVersionsFile(versions),
      message: '📦 Update versions',
      sha,
      branch,
    },
    token,
  );
}

/**
 * Create a new version
 */
export async function createVersion(
  owner: string,
  repo: string,
  version: Omit<Version, 'createdAt'>,
  currentVersions: Version[],
  token: string,
  branch?: string,
): Promise<Version[]> {
  const newVersion: Version = {
    ...version,
    createdAt: new Date().toISOString(),
  };

  const updatedVersions = [...currentVersions, newVersion];
  await saveVersions(owner, repo, updatedVersions, token, branch);

  return updatedVersions;
}

/**
 * Update an existing version
 */
export async function updateVersion(
  owner: string,
  repo: string,
  version: Version,
  currentVersions: Version[],
  token: string,
  branch?: string,
): Promise<Version[]> {
  const updatedVersions = currentVersions.map(v => (v.id === version.id ? version : v));

  await saveVersions(owner, repo, updatedVersions, token, branch);

  return updatedVersions;
}

/**
 * Delete a version
 */
export async function deleteVersion(
  owner: string,
  repo: string,
  versionId: string,
  currentVersions: Version[],
  token: string,
  branch?: string,
): Promise<Version[]> {
  const updatedVersions = currentVersions.filter(v => v.id !== versionId);
  await saveVersions(owner, repo, updatedVersions, token, branch);

  return updatedVersions;
}

/**
 * Generate a unique version ID
 */
export function generateVersionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `v-${timestamp}-${random}`;
}

// ============================================================================
// Image Management
// ============================================================================

/**
 * Get the default branch of a repository
 */
async function getDefaultBranch(owner: string, repo: string, token: string): Promise<string> {
  const repository = await fetchRepository(owner, repo, token);
  return repository.default_branch;
}

/**
 * Allowed image extensions
 */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

/**
 * Check if a filename has an allowed image extension
 */
export function isValidImageExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_IMAGE_EXTENSIONS.includes(ext) : false;
}

/**
 * Get the image path for a ticket
 */
export function getImagePath(ticketId: string, imageName: string): string {
  return `.kabane/images/${ticketId}/${imageName}`;
}

/**
 * Get the full URL for an image in the repository (for public repos)
 */
export function getImageUrl(
  owner: string,
  repo: string,
  ticketId: string,
  imageName: string,
  branch: string = 'main',
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.kabane/images/${ticketId}/${imageName}`;
}

/**
 * Get the image content as a data URL (works for private repos)
 * Handles large files by using Git Blobs API when content is not returned directly
 */
export async function getImageAsDataUrl(
  owner: string,
  repo: string,
  ticketId: string,
  imageName: string,
  token: string,
  branch: string = 'main',
): Promise<string> {
  const imagePath = `.kabane/images/${ticketId}/${imageName}`;

  // Determine MIME type from extension
  const ext = imageName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  const response = await githubFetch<GitHubContent>(
    `/repos/${owner}/${repo}/contents/${imagePath}?ref=${branch}`,
    token,
  );

  // For small files, content is returned directly as base64
  if (response.content) {
    const base64Content = response.content.replace(/\n/g, '');
    return `data:${mimeType};base64,${base64Content}`;
  }

  // For large files (> 1MB), GitHub doesn't return content directly
  // We need to use the Git Blobs API instead
  if (response.sha) {
    const blobResponse = await githubFetch<{ content: string; encoding: string }>(
      `/repos/${owner}/${repo}/git/blobs/${response.sha}`,
      token,
    );

    if (blobResponse.content && blobResponse.encoding === 'base64') {
      const base64Content = blobResponse.content.replace(/\n/g, '');
      return `data:${mimeType};base64,${base64Content}`;
    }
  }

  throw new Error('Unable to load image content');
}

/**
 * Upload an image for a ticket
 */
export async function uploadImage(
  owner: string,
  repo: string,
  ticketId: string,
  file: File,
  token: string,
  branch?: string,
): Promise<string> {
  // Validate file extension
  if (!isValidImageExtension(file.name)) {
    throw new Error(`Invalid image extension. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`);
  }

  // Read file as base64
  const content = await fileToBase64(file);

  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const imageName = `${timestamp}-${sanitizedName}`;
  const imagePath = getImagePath(ticketId, imageName);

  // Get the target branch
  const targetBranch = branch || (await getDefaultBranch(owner, repo, token));

  // Create the file in GitHub
  await githubFetch<GitHubContent>(`/repos/${owner}/${repo}/contents/${imagePath}`, token, {
    method: 'PUT',
    body: {
      message: `Add image ${imageName} for ticket ${ticketId}`,
      content,
      branch: targetBranch,
    },
  });

  return imageName;
}

/**
 * Delete an image from a ticket
 */
export async function deleteImage(
  owner: string,
  repo: string,
  ticketId: string,
  imageName: string,
  token: string,
  branch?: string,
): Promise<void> {
  const imagePath = getImagePath(ticketId, imageName);
  const targetBranch = branch || (await getDefaultBranch(owner, repo, token));

  // Get the current file to obtain its SHA
  const file = await githubFetch<GitHubContent>(
    `/repos/${owner}/${repo}/contents/${imagePath}?ref=${targetBranch}`,
    token,
  );

  // Delete the file
  await githubFetch(`/repos/${owner}/${repo}/contents/${imagePath}`, token, {
    method: 'DELETE',
    body: {
      message: `Delete image ${imageName} from ticket ${ticketId}`,
      sha: file.sha,
      branch: targetBranch,
    },
  });
}

/**
 * List all images for a ticket
 */
export async function listTicketImages(
  owner: string,
  repo: string,
  ticketId: string,
  token: string,
  branch?: string,
): Promise<string[]> {
  const imagesPath = `.kabane/images/${ticketId}`;
  const targetBranch = branch || (await getDefaultBranch(owner, repo, token));

  try {
    const contents = await githubFetch<GitHubContent[]>(
      `/repos/${owner}/${repo}/contents/${imagesPath}?ref=${targetBranch}`,
      token,
    );

    return contents.filter(item => item.type === 'file' && isValidImageExtension(item.name)).map(item => item.name);
  } catch (error) {
    // Return empty array if the images folder doesn't exist
    if (error instanceof GitHubAPIError && error.isNotFound) {
      return [];
    }
    throw error;
  }
}

/**
 * Convert a File to base64 string (without data URI prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URI prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
