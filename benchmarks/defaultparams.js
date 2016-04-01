import { KinveyBenchmark } from './benchmark';

function factorial1(x) {
  if (x <= 0) {
    return 1;
  }

  return x * factorial1(x - 1);
}

function facRec2(x, acc) {
  acc = acc || 1;

  if (x <= 1) {
    return acc;
  }

  return facRec2(x - 1, x * acc);
}
function factorial2(n) {
  return facRec2(n);
}

function facRec3(x, acc) {
  if (x <= 1) {
    return acc;
  }

  return facRec3(x - 1, x * acc);
}
function factorial3(n) {
  return facRec3(n, 1);
}

export class DefaultParamsBenchmark extends KinveyBenchmark {
  execute() {
    const promise = super.execute().then(() => {
      this.suite.add('naive recursion', () => {
        return factorial1(10);
      })
      .add('tail recursion using default parameter', () => {
        return factorial2(10);
      })
      .add('tail recursion using no default parameter', () => {
        return factorial3(10);
      })
      .on('cycle', function(event) {
        console.log(String(event.target));
      })
      .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
      })
      .run({ async: true });
    });
    return promise;
  }
}
