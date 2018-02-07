import keys from 'lodash/keys';

import { Client } from '../../client';
import { KinveyError } from '../../errors';
import { InmemoryOfflineRepository } from './offline-repositories';
import { NetworkRepository } from './network-repository';
import { storageProvider } from './storage-provider';
import { ensureArray } from '../../utils';
import { InmemoryCrudQueue } from '../utils';
import { MemoryKeyValuePersister } from '../persisters';

const testSupportCollection = '__testSupport__';

const inmemoryRepoBuilder = (queue) => {
  const persister = new MemoryKeyValuePersister();
  return new InmemoryOfflineRepository(persister, queue);
};

// all inmemory instances should share the queue
const queue = new InmemoryCrudQueue();
let _chosenRepoPromise;

let availableStorages = {
  [storageProvider.inmemory]: inmemoryRepoBuilder
};

function _getRepoType() {
  return Client.sharedInstance().storage;
}

function _testRepoSupport(repo) {
  return repo.create(testSupportCollection, { _id: '1' });
}

function _getRepoForStorageProvider(storageProvider) {
  const repoBuilder = availableStorages[storageProvider];
  if (!repoBuilder) {
    const errMsg = `The requested storage provider "${storageProvider}" is not available in this environment`;
    throw new KinveyError(errMsg);
  }
  return repoBuilder(queue);
}

/**
 * Selects the first repo from the priority list,
 * which returns a resolved promise for the support test
 * @param {string[]} storagePrecedence An array of enum values, sorted by priority
 */
function _getFirstSupportedRepo(storagePrecedence) {
  return storagePrecedence.reduce((result, storageProvider) => {
    return result.catch(() => {
      const repo = _getRepoForStorageProvider(storageProvider);
      return _testRepoSupport(repo)
        .then(() => repo);
    });
  }, Promise.reject());
}

function _chooseOfflineRepo() {
  const storagePrecedence = ensureArray(_getRepoType());

  return _getFirstSupportedRepo(storagePrecedence)
    .then((repo) => {
      if (!repo) {
        const errMsg = 'None of the selected storage providers are supported in this environment.';
        return Promise.reject(new KinveyError(errMsg));
      }
      return repo;
    });
}

function getOfflineRepository() {
  if (!_chosenRepoPromise) {
    _chosenRepoPromise = _chooseOfflineRepo();
  }
  return _chosenRepoPromise;
}

function getNetworkRepository() {
  return new NetworkRepository();
}

function setSupportedRepoBuilders(repos) {
  availableStorages = repos;
}

function getSupportedStorages() {
  return keys(availableStorages);
}

export const repositoryProvider = {
  getNetworkRepository,
  getOfflineRepository,
  setSupportedRepoBuilders,
  getSupportedStorages
};
