import * as Aggregation from 'kinvey-aggregation';

const BackwardsCompatibleAggregation = Aggregation.Aggregation;

Object.keys(Aggregation).forEach((key) => {
  const val = Aggregation[key];

  if (val !== Aggregation.Aggregation) {
    BackwardsCompatibleAggregation[key] = val;
  }
});

export { BackwardsCompatibleAggregation as Aggregation };
