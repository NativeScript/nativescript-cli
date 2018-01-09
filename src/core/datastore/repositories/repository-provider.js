import { Client } from '../../client';
import { InmemoryOfflineRepository } from './offline-repositories';
import { NetworkRepository } from './network-repository';
import { storageType } from './storage-type';
import { ensureArray, wrapInPromise } from '../../utils';
import { InmemoryCrudQueue } from '../utils';
import { MemoryKeyValuePersister } from '../persisters';

const inmemoryRepoBuilder = (queue) => {
  const persister = new MemoryKeyValuePersister();
  return new InmemoryOfflineRepository(persister, queue);
};

// TODO: all inmemory instances should share the queue. are there better ways to share it?
// queue needs to be by collection
const queue = new InmemoryCrudQueue();

// TODO: not great to do this here, but tests fail otherwise
let supportedStorages = {
  [storageType.inmemory]: inmemoryRepoBuilder,
  [storageType.default]: inmemoryRepoBuilder
};

function getRepoType() {
  return Client.sharedInstance().storageType;
}

function getNetworkRepository() {
  return new NetworkRepository();
}

function getOfflineRepository() {
  const repoPrecendence = ensureArray(getRepoType() || storageType.default);
  const firstSupportedStorage = repoPrecendence.find(storageType => !!supportedStorages[storageType]);
  const repoBuilder = supportedStorages[firstSupportedStorage];
  return wrapInPromise(repoBuilder(queue));
}

function setSupportedConstructors(repos) {
  // TODO: validation of repos?
  supportedStorages = repos;
}

export const repositoryProvider = {
  getNetworkRepository,
  getOfflineRepository,
  setSupportedConstructors
};
