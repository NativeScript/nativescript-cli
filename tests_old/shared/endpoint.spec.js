import { expect } from 'chai';
import * as Kinvey from '__SDK__';
import * as config from './config';
import * as utilities from './utils';

describe('Endpoint', () => {
  const createdUserIds = [];
  
  before(() => {
    return Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

  before((done) => {
    Kinvey.User.signup()
      .then((user) => {
        createdUserIds.push(user.data._id);
        done();
      })
      .catch(done);
  });

  after((done) => {
    utilities.cleanUpAppData(config.collectionName, createdUserIds)
      .then(() => done())
      .catch(done);
  });

  it('should invoke an endpoint and return the result', (done) => {
    Kinvey.CustomEndpoint.execute('testEndpoint')
      .then((res) => {
        expect(res).to.deep.equal({ property1: 'value1', property2: 'value2' });
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should send body properties and return the result', (done) => {
    const argsValue = {
      property1: 'sentProperty1',
      property2: 'sentProperty2'
    };
    Kinvey.CustomEndpoint.execute('testEndpointReturnsArgs', argsValue)
      .then((res) => {
        expect(res).to.deep.equal(argsValue);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should throw error for non-existing endpoint', (done) => {
    Kinvey.CustomEndpoint.execute('noEndpoint')
      .then(() => {
        Promise.reject(new Error('This should not happen.'));
      })
      .catch((err) => {
        expect(err.message).to.equal('The custom endpoint you tried to access does not exist. Please configure custom Business Logic endpoints through the Kinvey Console.');
        done();
      });
  });

  // Skipped until MLIBZ-2844
  it.skip('should throw error for non-object args parameter', (done) => {
    Kinvey.CustomEndpoint.execute('testEndpoint', 'stringValue')
      .then(() => {
        Promise.reject(new Error('This should not happen.'));
      })
      .catch((err) => {
        expect(err.message).to.equal('Custom endpoint parameters can only be of type object');
        done();
      });
  });
});
