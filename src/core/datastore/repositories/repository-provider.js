import { Client } from '../../client';
import { InmemoryOfflineRepository } from './offline-repositories';
import { NetworkRepository } from './network-repository';
import { storageType } from './storage-type';
import { persisterProvider } from '../persisters';
import { ensureArray } from '../../utils';
import { InmemoryCrudQueue } from '../utils';

const defaultConstructorName = 'default';
const inmemoryRepoBuilder = (queue) => {
  const persister = persisterProvider.getPersister();
  return new InmemoryOfflineRepository(persister, queue);
};

// TODO: all inmemory instances should share the queue. are there better ways to share it?
// queue needs to be by collection
const queue = new InmemoryCrudQueue();
// TODO: not great to do this here, but tests fail otherwise
let supportedStorages = {
  [storageType.inmemory]: inmemoryRepoBuilder,
  [defaultConstructorName]: inmemoryRepoBuilder
};

function getRepoType() {
  return Client.sharedInstance().storageType;
}

function getNetworkRepository() {
  return new NetworkRepository();
}

function getOfflineRepository() {
  const repoPrecendence = ensureArray(getRepoType() || defaultConstructorName);
  const firstSupportedStorage = repoPrecendence.find(storageType => !!supportedStorages[storageType]);
  const repoBuilder = supportedStorages[firstSupportedStorage];
  return repoBuilder(queue);
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
