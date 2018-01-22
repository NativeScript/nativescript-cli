export function applyQueryToDataset(dataset, query) {
  if (!query) {
    return dataset;
  }
  return query.process(dataset);
}

export function applyAggregationToDataset(dataset, aggregationQuery) {
  return aggregationQuery.process(dataset);
}
