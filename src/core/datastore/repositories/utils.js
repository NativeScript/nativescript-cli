import { Client } from '../../client';

import { stripTagFromCollectionName } from '../utils';

/**
 * @private
 */
export const testSupportCollection = '__testSupport__';

/**
 * @private
 */
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

/**
 * @private
 */
export function applyQueryToDataset(dataset, query) {
  if (!query) {
    return dataset;
  }
  return query.process(dataset);
}

/**
 * @private
 */
export function applyAggregationToDataset(dataset, aggregationQuery) {
  return aggregationQuery.process(dataset);
}
