require('babel-register')({
  presets: ['es2015', 'stage-2'],
  ignore: /node_modules\/(?!qs)/
});
// const NetworkStoreBenchmark = require('./networkstore').NetworkStoreBenchmark;
// const networkStoreBenchmark = new NetworkStoreBenchmark();
// networkStoreBenchmark.execute();

const CacheStoreBenchmark = require('./cachestore').CacheStoreBenchmark;
const cacheStoreBenchmark = new CacheStoreBenchmark();
cacheStoreBenchmark.execute();

// const DefaultParamsBenchmark = require('./defaultparams').DefaultParamsBenchmark;
// const defaultParamsBenchmark = new DefaultParamsBenchmark();
// defaultParamsBenchmark.execute();
