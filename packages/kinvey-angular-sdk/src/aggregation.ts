import { Injectable } from '@angular/core';
import { Aggregation } from './sdk';

@Injectable({
  providedIn: 'root'
})
export class KinveyAggregationService {
  create(aggregation) {
    return new Aggregation(aggregation);
  }

  count(field: string) {
    return Aggregation.count(field);
  }

  sum(field: string) {
    return Aggregation.sum(field);
  }

  min(field: string) {
    return Aggregation.min(field);
  }

  max(field: string) {
    return Aggregation.max(field);
  }

  average(field: string) {
    return Aggregation.average(field);
  }
}
