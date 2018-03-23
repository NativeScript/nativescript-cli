import { Client } from '../../client';

import { stripTagFromCollectionName } from '../utils';

export const testSupportCollection = '__testSupport__';

export function buildCollectionUrl(collectionName, id, restAction) {
  collectionName = stripTagFromCollectionName(collectionName);
  let result = `appdata/${Client.sharedInstance().appKey}/${collectionName}`;
  if (id) {
    result += `/${id}`;
  }
  if (restAction) {
    result += `/${restAction}`;
  }
  return result;
}

export function applyQueryToDataset(dataset, query) {
  if (!query) {
    return dataset;
  }
  return query.process(dataset);
}

export function applyAggregationToDataset(dataset, aggregationQuery) {
  return aggregationQuery.process(dataset);
}
