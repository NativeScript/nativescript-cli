import '../setup';
// import { Client } from '../../src/client';
// import { Properties, KinveyRequest, KinveyRequestConfig } from '../../src/requests/request';
import { NetworkRequest } from '../../src/requests/network';
import nock from 'nock';
import chai from 'chai';
const expect = chai.expect;

describe('NetworkRequest', function() {
  describe('constructor', function() {
    it('should return an instance of NetworkRequest', function() {
      const request = new NetworkRequest();
      expect(request).to.be.instanceof(NetworkRequest);
    });
  });

  describe('execute', function() {
    it('should return the response', async function() {
      const reply = { test: 'Hello World' };
      nock(this.client.baseUrl)
        .get('/')
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      const request = new NetworkRequest();
      const response = await request.execute();
      expect(response.data).to.deep.equal(reply);
    });
  });
});
