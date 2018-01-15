import {
  repositoryProvider,
  storageType,
  KeyValueStoreOfflineRepository,
  SqliteKeyValueStorePersister,
} from '../core/datastore';

const sqliteStorageBuilder = (queue) => {
  const persister = new SqliteKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: sqliteStorageBuilder,
  [storageType.sqlite]: sqliteStorageBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
