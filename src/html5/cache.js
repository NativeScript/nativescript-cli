import { WebSqlKeyValueStorePersister } from '../core/datastore/persisters';
import { repositoryProvider, storageType, KeyValueStoreOfflineRepository } from '../core/datastore/repositories';

<<<<<<< HEAD
export class Html5CacheMiddleware extends CacheMiddleware {
  loadStorage(name, storageProviders) {
    return new Html5Storage(name, storageProviders);
  }
}
=======
const webSqlBuilder = (queue) => {
  const persister = new WebSqlKeyValueStorePersister();
  return new KeyValueStoreOfflineRepository(persister, queue);
};

// TODO: this will grow, refactor
const repoConstructors = {
  [storageType.default]: webSqlBuilder, // TODO: get the default support chain
  [storageType.webSql]: webSqlBuilder
};

repositoryProvider.setSupportedConstructors(repoConstructors);
>>>>>>> MLIBZ-2263 Add WebSql persistance. Made it pluggable from html5 shim.
