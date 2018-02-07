import { Html5Client } from './client';

import {
  repositoryProvider,
  StorageProvider,
  KeyValueStoreOfflineRepository,
  SqlKeyValueStorePersister,
  InmemoryOfflineRepository,
  WebSqlSqlModule,
  IndexedDbKeyValueStorePersister,
  BrowserKeyValuePersister
} from '../core/datastore';

const webSqlBuilder = (queue) => {
  const sqlModule = new WebSqlSqlModule(Html5Client.sharedInstance().appKey);
  const persister = new SqlKeyValueStorePersister(sqlModule);
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const indexedDbBuilder = (queue) => {
  const persister = new IndexedDbKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const localStorageBuilder = (queue) => {
  const persister = new BrowserKeyValuePersister(global.localStorage);
  return new InmemoryOfflineRepository(persister, queue);
};

const sessionStorageBuilder = (queue) => {
  const persister = new BrowserKeyValuePersister(global.sessionStorage);
  return new InmemoryOfflineRepository(persister, queue);
};

const repoConstructors = {
  [StorageProvider.WebSQL]: webSqlBuilder,
  [StorageProvider.IndexedDB]: indexedDbBuilder,
  [StorageProvider.LocalStorage]: localStorageBuilder,
  [StorageProvider.SessionStorage]: sessionStorageBuilder
};

repositoryProvider.setSupportedRepoBuilders(repoConstructors);
