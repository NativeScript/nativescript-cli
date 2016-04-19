import { KinveyBenchmark } from './benchmark';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import sample10kJSON from './json/sample1k.json';
import LegacyKinvey from 'kinvey';
import nock from 'nock';

export class NetworkStoreBenchmark extends KinveyBenchmark {
  createSimulatedResponses() {
    nock(this.client.baseUrl)
      .get(() => true)
      .query(true)
      .times(Infinity)
      .reply(200, sample10kJSON, {
        'content-type': 'application/json'
      });
  }

  execute() {
    const promise = super.execute().then(() => {
      const promise = new Promise(resolve => {
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
        .on('cycle', event => {
          console.log(String(event.target));
        })
        .on('complete', function() {
          nock.cleanAll();
          console.log(`Fastest is ${this.filter('fastest').map('name')}.`);
          resolve();
        })
        .run({ async: true });
      });
      return promise;
    });
    return promise;
  }
}
