import { KinveyBenchmark } from './benchmark';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import books10kJSON from './json/books10k.json';
import nock from 'nock';

export class CacheStoreBenchmark extends KinveyBenchmark {
  execute() {
    nock(this.client.baseUrl)
      .get(function() {
        return true;
      })
      .query(true)
      .times(Infinity)
      .reply(200, books10kJSON, {
        'content-type': 'application/json'
      });

    const promise = super.execute().then(() => {
      const store = DataStore.getInstance('books', DataStoreType.Cache);
      store.find().then(response => {
        return response.networkPromise;
      }).then(() => {
        this.suite.add('CacheStore#find with no delta fetch', deferred => {
          store.find(null, { deltaFetch: false }).then(response => {
            return response.networkPromise;
          }).then(() => {
            deferred.resolve();
          }).catch(() => {
            deferred.reject();
          });
        }, {
          defer: true
        })
        .add('CacheStore#find with delta fetch', deferred => {
          store.find().then(response => {
            return response.networkPromise;
          }).then(() => {
            deferred.resolve();
          }).catch(() => {
            deferred.reject();
          });
        }, {
          defer: true
        })
        .on('cycle', function(event) {
          console.log(String(event.target));
        })
        .on('complete', function() {
          nock.cleanAll();
          console.log('Fastest is ' + this.filter('fastest').map('name'));
        })
        .run({ async: true });
      });
    });
    return promise;
  }
}
