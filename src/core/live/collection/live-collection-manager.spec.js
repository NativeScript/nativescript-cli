import expect from 'expect';

import * as nockHelper from '../nock-helper';
import { invalidOrMissingCheckRegexp } from '../utilities';
import { mockRequiresIn } from '../../datastore/require-helper';
import { init } from '../../kinvey';
import { randomString } from '../../utils';
import { UserMock } from '../../user/user-mock';
import { NetworkRack } from '../../request';
import { NodeHttpMiddleware } from '../../../node/http';
import { getLiveCollectionManager } from './live-collection-manager';

describe('LiveCollectionManager', () => {
  /** @type {LiveCollectionManager} */
  let manager;
  let client;
  let expectedCollectionChannel;
  let expectedPersonalCollectionChannel;
  const liveServiceMock = {
    subscribeToChannel: () => { },
    unsubscribeFromChannel: () => { }
  };
  const collectionName = 'someCollection';

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
    nockHelper.setClient(client);
    expectedCollectionChannel = `${client.appKey}.c-${collectionName}`;
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
    return UserMock.login(randomString(), randomString())
      .then(() => {
        expectedPersonalCollectionChannel = `${expectedCollectionChannel}.u-${client.getActiveUser()._id}`;
      });
  });

  beforeEach(() => {
    const pathToLiveManager = './live-collection-manager';
    const mocks = {
      '../live-service': { getLiveService: () => liveServiceMock }
    };

    delete require.cache[require.resolve(pathToLiveManager)];
    const getManager = mockRequiresIn(__dirname, pathToLiveManager, mocks, 'getLiveCollectionManager');

    manager = getManager();
  });

  it('should be a singleton', () => {
    const manager1 = getLiveCollectionManager();
    const manager2 = getLiveCollectionManager();
    expect(manager1).toEqual(manager2);
  });

  describe('subscribeCollection()', () => {
    it('should fail if no collection name is passed', (done) => {
      const receiver = { onMessage: () => { } };
      manager.subscribeCollection(undefined, receiver)
        .then(() => done(new Error('subscribeCollection() succeeded with no collection name')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should fail if invalid collection name is passed', (done) => {
      const receiver = { onMessage: () => { } };
      manager.subscribeCollection('', receiver)
        .then(() => done(new Error('subscribeCollection() succeeded with invalid collection name')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should fail if no receiver is passed', (done) => {
      manager.subscribeCollection('some name')
        .then(() => done(new Error('subscribeCollection() succeeded with no receiver')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should fail if invalid receiver is passed', (done) => {
      manager.subscribeCollection('some name', { test: 1 })
        .then(() => done(new Error('subscribeCollection() succeeded with no receiver')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should make POST request to /_subscribe endpoint', () => {
      const scope = nockHelper.mockCollectionSubscribeRequest(collectionName);
      const receiver = { onMessage: () => { } };
      return manager.subscribeCollection(collectionName, receiver)
        .then(() => {
          scope.done();
        });
    });

    it('should call LiveService\'s subscribeToChannel() method', () => {
      const scope = nockHelper.mockCollectionSubscribeRequest(collectionName);
      const receiver = { onError: () => { } };
      const spy = expect.spyOn(liveServiceMock, 'subscribeToChannel');

      return manager.subscribeCollection(collectionName, receiver)
        .then(() => {
          expect(spy.calls.length).toBe(2);
          expect(spy).toHaveBeenCalledWith(expectedCollectionChannel, receiver);
          expect(spy).toHaveBeenCalledWith(expectedPersonalCollectionChannel, receiver);
          scope.done();
        });
    });
  });

  describe('unsubscribeCollection()', () => {
    it('should fail if no collection name is passed', (done) => {
      manager.unsubscribeCollection()
        .then(() => done(new Error('unsubscribeCollection() succeeded with no collection name')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should fail if invalid collection name is passed', (done) => {
      manager.unsubscribeCollection('')
        .then(() => done(new Error('unsubscribeCollection() succeeded with invalid collection name')))
        .catch((err) => {
          expect(err.message).toMatch(invalidOrMissingCheckRegexp);
          done();
        })
        .catch(e => done(e));
    });

    it('should make POST request to /_unsubscribe endpoint', () => {
      const scope = nockHelper.mockCollectionUnsubscribeRequest(collectionName);
      return manager.unsubscribeCollection(collectionName)
        .then(() => {
          scope.done();
        });
    });

    it('should call LiveService\'s unsubscribeFromChannel() method', () => {
      const scope = nockHelper.mockCollectionUnsubscribeRequest(collectionName);
      const spy = expect.spyOn(liveServiceMock, 'unsubscribeFromChannel');
      return manager.unsubscribeCollection(collectionName)
        .then(() => {
          expect(spy.calls.length).toBe(2);
          expect(spy).toHaveBeenCalledWith(expectedCollectionChannel);
          expect(spy).toHaveBeenCalledWith(expectedPersonalCollectionChannel);
          scope.done();
        });
    });
  });
});
