import localConfig from './localConfig';
import { msg } from '@lit/localize';
import { notifications } from './notifications';
import {
  parseRepoFullName,
  GitHubAPIError,
  updateVersion,
  createVersion,
  generateVersionId,
  loadVersions,
} from '../api';
import { Version } from '@/types';
import { appMobx } from './app-mobx';
import { makeAutoObservable } from 'mobx';
import { DEFAULT_VERSIONS } from './parser';

export class VersionsManager {
  public versions: Version[] = [];

  public selectedVersionId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  public clear() {
    this.versions = [];
  }

  public setSelectedVersionId(id: string | null) {
    this.selectedVersionId = id;
  }

  public async loadVersions() {
    // Load versions
    let versions: Version[] = DEFAULT_VERSIONS;
    try {
      versions = await loadVersions(
        appMobx.repository!.owner.login,
        appMobx.repository!.name,
        appMobx.token!,
        appMobx.repository?.default_branch,
      );
    } catch (error) {
      if (!(error instanceof GitHubAPIError && error.isNotFound)) {
        console.warn('Failed to load versions.yml:', error);
      }
    }
    this.versions = versions;
  }

  public async createVersion(version: Omit<Version, 'id'>) {
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

      // Generate version ID
      const versionWithId = {
        ...version,
        id: generateVersionId(),
      };

      this.versions = await createVersion(owner, repo, versionWithId, this.versions, token, branch);

      // Auto-select the new version
      this.selectedVersionId = versionWithId.id;

      notifications.showToast(msg('Version created successfully'), 'success');
    } catch (err) {
      console.error('Failed to create version:', err);
      notifications.showToast(err instanceof Error ? err.message : msg('Failed to create version'), 'error');
    } finally {
      appMobx.setLoading(false);
    }
  }

  /**
   * Handle updating an existing version
   */
  public async updateVersion(version: Version) {
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

      this.versions = await updateVersion(owner, repo, version, this.versions, token, branch);

      notifications.showToast(msg('Version updated successfully'), 'success');
    } catch (err) {
      console.error('Failed to update version:', err);
      notifications.showToast(err instanceof Error ? err.message : msg('Failed to update version'), 'error');
    } finally {
      appMobx.setLoading(false);
    }
  }
}

const versionsManager = new VersionsManager();
(window as any).versionsManager = versionsManager; // Expose for debugging
export default versionsManager;
