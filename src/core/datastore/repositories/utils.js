import { Client } from '../../client';

import { stripTagFromCollectionName } from '../utils';

export function buildCollectionUrl(collectionName, id, restAction) {
  collectionName = stripTagFromCollectionName(collectionName); // collectionName.replace(_separatorAndTagRegexp, ''); // strip tag
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
