import { SyncManager } from './sync-manager';
import { repositoryProvider } from '../repositories';
import { SyncStateManager } from './sync-state-manager';

function getSyncStateManager() {
  return new SyncStateManager();
}

function getSyncManager() {
  const networkRepo = repositoryProvider.getNetworkRepository();
  const syncStateManager = getSyncStateManager();
  return new SyncManager(networkRepo, syncStateManager);
}

export const syncManagerProvider = {
  getSyncManager
};
