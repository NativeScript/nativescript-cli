import {
  repositoryProvider,
  StorageProvider,
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
  [StorageProvider.SQLite]: sqliteStorageBuilder
};

repositoryProvider.setSupportedRepoBuilders(repoConstructors);
