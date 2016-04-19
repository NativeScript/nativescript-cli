import { KinveyBenchmark } from './benchmark';
import { DataStore, DataStoreType } from '../src/stores/datastore';
import { randomString } from '../src/utils/string';
// import LegacyKinvey from 'kinvey';
import sampleJSON from './json/sample10k.json';
import nock from 'nock';

export class SyncStoreBenchmark extends KinveyBenchmark {
  createSimulatedResponses() {
    nock(this.client.baseUrl)
      .put(() => true)
      .query(true)
      .times(Infinity)
      .reply(200, {
        _id: randomString(),
        seq: 1,
        first: 'Rosa',
        last: 'Waters',
        age: 36,
        street: 'Uzbaf Extension',
        city: 'Pemifkon',
        state: 'KY',
        zip: 12264,
        dollar: '$7473.30',
        pick: 'RED',
        _acl: {
          creator: this.client.appKey
        },
        _kmd: {
          lmt: '2015-09-21T21:11:38.720Z',
          ect: '2015-09-21T21:11:38.720Z'
        }
      }, {
        'content-type': 'application/json'
      });
  }

  execute() {
    const promise = super.execute().then(() => {
      const store = DataStore.getInstance('books', DataStoreType.Sync);
      return store.save(sampleJSON)/* .then(() => LegacyKinvey.DataStore.save(sampleJSON)) */.then(() => {
        const promise = new Promise(resolve => {
          this.suite.add('SyncStore#push', deferred => {
            store.push().then(() => {
              deferred.resolve();
            }).catch(() => {
              deferred.reject();
            });
          }, {
            defer: true
          })
          // .add('LegacyNetworkStore#find', deferred => {
          //   LegacyKinvey.Sync.online().then(() => {
          //     deferred.resolve();
          //   }).catch(() => {
          //     deferred.reject();
          //   });
          // }, {
          //   defer: true
          // })
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
    });
    return promise;
  }
}
