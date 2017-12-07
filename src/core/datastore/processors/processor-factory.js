import { repositoryProvider } from '../repositories';
import { OfflineDataProcessor } from './offline-data-processor';
import { NetworkDataProcessor } from './network-data-processor';
import { CacheOfflineDataProcessor } from './cache-offline-data-processor';
import { syncManagerProvider } from '../sync';

function getOfflineProcessor() {
  const syncManager = syncManagerProvider.getSyncManager();
  return new OfflineDataProcessor(syncManager);
}

function getNetworkProcessor() {
  return new NetworkDataProcessor();
}

function getCacheOfflineDataProcessor() {
  const networkRepo = repositoryProvider.getNetworkRepository();
  const syncManager = syncManagerProvider.getSyncManager();
  return new CacheOfflineDataProcessor(syncManager, networkRepo);
}

export const processorFactory = {
  getOfflineProcessor,
  getNetworkProcessor,
  getCacheOfflineDataProcessor
};
