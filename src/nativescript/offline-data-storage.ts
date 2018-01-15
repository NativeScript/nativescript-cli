import {
  repositoryProvider,
  storageType,
  KeyValueStoreOfflineRepository,
  SqliteKeyValueStorePersister
} from '../core/datastore';
import { Client } from './client';
import { NativescriptSqliteModule } from './nativescript-sqlite-module';

const sqliteStorageBuilder = (queue) => {
  const sqlModule = new NativescriptSqliteModule(Client.sharedInstance().appKey);
  const persister = new SqliteKeyValueStorePersister(sqlModule);
  return new KeyValueStoreOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: sqliteStorageBuilder,
  [storageType.sqlite]: sqliteStorageBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
