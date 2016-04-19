/* eslint-disable */
require('babel-register')({
  presets: ['es2015', 'stage-2'],
  ignore: /node_modules\/(?!qs)/
});
const async = require('async');
const NetworkStoreBenchmark = require('./networkstore').NetworkStoreBenchmark;
const CacheStoreBenchmark = require('./cachestore').CacheStoreBenchmark;
const SyncStoreBenchmark = require('./syncstore').SyncStoreBenchmark;

async.series([
    // function(callback) {
    //   const networkStoreBenchmark = new NetworkStoreBenchmark();
    //   networkStoreBenchmark.execute().then(() => {
    //     callback();
    //   });
    // },
    // function(callback) {
    //   const cacheStoreBenchmark = new CacheStoreBenchmark();
    //   cacheStoreBenchmark.execute().then(() => {
    //     callback();
    //   });
    // },
    function(callback) {
      const syncStoreBenchmark = new SyncStoreBenchmark();
      syncStoreBenchmark.execute().then(() => {
        callback();
      });
    }
]);
