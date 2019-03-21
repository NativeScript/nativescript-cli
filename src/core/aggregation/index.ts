import Aggregation from './aggregation';
import average from './average';
import count from './count';
import max from './max';
import min from './min';
import sum from './sum';

(Aggregation as any).average = average;
(Aggregation as any).count = count;
(Aggregation as any).max = max;
(Aggregation as any).min = min;
(Aggregation as any).sum = sum;

export default Aggregation;
