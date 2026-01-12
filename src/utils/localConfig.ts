import { LocalConfig } from '@/types';

const loadLocalConfig = async (): Promise<LocalConfig> => {
  const response = await fetch('./kabane.config.json');

  if (!response.ok) {
    throw new Error('kabane.config.json not found. ' + 'Please create this file in the root of your deployment.');
  }

  const config = await response.json();

  // Validate required fields
  if (!config.repository) {
    throw new Error('Missing "repository" in kabane.config.json');
  }

  return {
    repository: config.repository,
    defaultBranch: config.defaultBranch,
  };
};

const localConfig = await loadLocalConfig();

export default localConfig;
