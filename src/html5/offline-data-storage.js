import { Html5Client } from './client';

import {
  repositoryProvider,
  storageType,
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
  [storageType.webSql]: webSqlBuilder,
  [storageType.indexedDb]: indexedDbBuilder,
  [storageType.localStorage]: localStorageBuilder,
  [storageType.sessionStorage]: sessionStorageBuilder
};

repositoryProvider.setSupportedRepoBuilders(repoConstructors);
