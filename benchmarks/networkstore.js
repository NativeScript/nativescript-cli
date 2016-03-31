import { KinveyBenchmark } from './benchmark';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import LegacyKinvey from 'kinvey';
import nock from 'nock';

export class NetworkStoreBenchmark extends KinveyBenchmark {
  execute() {
    const promise = super.execute().then(() => {
      this.suite.add('NetworkStore#find', deferred => {
        const store = DataStore.getInstance('books', DataStoreType.Network);

        nock(this.client.baseUrl)
          .get(store._pathname)
          .query(true)
          .reply(200, [], {
            'content-type': 'application/json'
          });

        store.find().then(() => {
          nock.cleanAll();
          deferred.resolve();
        }).catch(() => {
          nock.cleanAll();
          deferred.reject();
        });
      }, {
        defer: true
      })
      .add('LegacyNetworkStore#find', deferred => {
        nock(this.client.baseUrl)
          .get(function() {
            return true;
          })
          .query(true)
          .reply(200, [], {
            'content-type': 'application/json'
          });

        LegacyKinvey.DataStore.find('books').then(() => {
          nock.cleanAll();
          deferred.resolve();
        }).catch(() => {
          nock.cleanAll();
          deferred.reject();
        });
      }, {
        defer: true
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
