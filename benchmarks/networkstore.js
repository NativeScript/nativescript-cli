import { KinveyBenchmark } from './benchmark';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import books10kJSON from './json/books10k.json';
import LegacyKinvey from 'kinvey';
import nock from 'nock';

export class NetworkStoreBenchmark extends KinveyBenchmark {
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
      this.suite.add('NetworkStore#find', deferred => {
        const store = DataStore.getInstance('books', DataStoreType.Network);
        store.find().then(() => {
          deferred.resolve();
        }).catch(() => {
          deferred.reject();
        });
      }, {
        defer: true
      })
      .add('LegacyNetworkStore#find', deferred => {
        LegacyKinvey.DataStore.find('books').then(() => {
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
    return promise;
  }
}
