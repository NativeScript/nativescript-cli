import {
  repositoryProvider,
  storageProvider,
  KeyValueStoreOfflineRepository,
  SqlKeyValueStorePersister
} from '../core/datastore';
import { Client as CoreClient } from '../core/client';
import { NativescriptSqlModule } from './nativescript-sql-module';

const sqliteStorageBuilder = (queue) => {
  const sqlModule = new NativescriptSqlModule(CoreClient.sharedInstance().appKey);
  const persister = new SqlKeyValueStorePersister(sqlModule);
  return new KeyValueStoreOfflineRepository(persister, queue);
};

const repoConstructors = {
  [storageProvider.sqlite]: sqliteStorageBuilder
};

repositoryProvider.setSupportedRepoBuilders(repoConstructors);
