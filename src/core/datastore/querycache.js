import { Promise } from 'es6-promise';
import isNumber from 'lodash/isNumber';
import isEmpty from 'lodash/isEmpty';
import { Query } from '../query';
import { repositoryProvider } from './repositories';
import { generateEntityId } from './utils';

export const queryCacheCollectionName = '_QueryCache';

function serializeQuery(query) {
  if (query && ((isNumber(query.skip) && query.skip > 0) || isNumber(query.limit))) {
    return null;
  }

  const queryObject = query ? query.toQueryString() : {};
  return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
}

export function getCachedQuery(collectionName, query) {
  const serializedQuery = serializeQuery(query);

  if (!serializedQuery && serializedQuery !== '') {
    return Promise.resolve(null);
  }

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const queryCacheQuery = new Query()
        .equalTo('collectionName', collectionName)
        .and()
        .equalTo('query', serializedQuery);
      return offlineRepo.read(queryCacheCollectionName, queryCacheQuery)
        .then((cachedQueries = []) => {
          if (cachedQueries.length > 0) {
            return cachedQueries[0];
          }

          return {
            _id: generateEntityId(),
            collectionName: collectionName,
            query: serializedQuery
          };
        });
    });
}

export function createCachedQuery(collectionName, query) {
  const serializedQuery = serializeQuery(query);

  if (!serializedQuery) {
    return Promise.resolve(null);
  }

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const cachedQuery = {
        _id: generateEntityId(),
        collectionName: collectionName,
        query: serializedQuery
      };
      return offlineRepo.create(queryCacheCollectionName, cachedQuery);
    });
}

export function updateCachedQuery(cachedQuery) {
  if (!cachedQuery) {
    return Promise.resolve(null);
  }

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      return offlineRepo.update(queryCacheCollectionName, cachedQuery);
    });
}

export function deleteCachedQuery(cachedQuery) {
  if (!cachedQuery) {
    return Promise.resolve(null);
  }

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      return offlineRepo.deleteById(queryCacheCollectionName, cachedQuery._id);
    });
}

export function clearQueryCache(collectionName) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const query = new Query().equalTo('collectionName', collectionName);
      return offlineRepo.delete(queryCacheCollectionName, query);
    });
}
