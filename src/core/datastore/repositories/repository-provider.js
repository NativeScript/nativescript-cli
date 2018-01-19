import keys from 'lodash/keys';

import { Client } from '../../client';
import { KinveyError } from '../../errors';
import { InmemoryOfflineRepository } from './offline-repositories';
import { NetworkRepository } from './network-repository';
import { storageType } from './storage-type';
import { ensureArray } from '../../utils';
import { InmemoryCrudQueue } from '../utils';
import { MemoryKeyValuePersister } from '../persisters';

const testSupportCollection = '__testSupport__';

const inmemoryRepoBuilder = (queue) => {
  const persister = new MemoryKeyValuePersister();
  return new InmemoryOfflineRepository(persister, queue);
};

// TODO: all inmemory instances should share the queue. are there better ways to share it?
// queue needs to be by collection
const queue = new InmemoryCrudQueue();

// TODO: not great to do this here, but tests fail otherwise
let availableStorages = {
  [storageType.inmemory]: inmemoryRepoBuilder
};

function _getRepoType() {
  return Client.sharedInstance().storageType;
}

function _testRepoSupport(repo) {
  return repo.create(testSupportCollection, { _id: '1' });
}

function _getRepoForStorageType(storageType) {
  const repoBuilder = availableStorages[storageType];
  if (!repoBuilder) {
    const errMsg = `The requested storage type "${storageType}" is not available in this environment`;
    throw new KinveyError(errMsg);
  }
  return repoBuilder(queue);
}

// TODO: maybe cache the selected repo?
function _getFirstSupportedRepo(storagePrecedence) {
  return storagePrecedence.reduce((result, storageType) => {
    return result.catch(() => {
      const repo = _getRepoForStorageType(storageType);
      return _testRepoSupport(repo)
        .then(() => repo);
    });
  }, Promise.reject());
}

function getOfflineRepository() {
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
