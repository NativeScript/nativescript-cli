import './setup';
import CustomEndpoint from '../src/endpoint';
import { KinveyError } from '../src/errors';
import { loginUser, logoutUser } from './utils/user';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('CustomEndpoint', function () {
  describe('execute()', function () {
    beforeEach(function() {
      return loginUser.call(this);
    });

    afterEach(function() {
      return logoutUser.call(this);
    });

    it('should respond', function () {
      expect(CustomEndpoint).itself.to.respondTo('execute');
    });

    it('should throw an error if and endpoint is not provided', function() {
      const promise = CustomEndpoint.execute();
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if the endpoint is not a string', function() {
      const promise = CustomEndpoint.execute({});
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should return the response from the custom endpoint', function() {
      const endpoint = 'testendpoint';
      const reply = {
        prop: randomString()
      };
      nock(this.client.baseUrl)
        .post(`/${rpcNamespace}/${this.client.appKey}/custom/${endpoint}`, () => true)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return CustomEndpoint.execute(endpoint).then(response => {
        expect(response).to.deep.equal(reply);
      });
    });

    it('should send args in request to custom endpoint', function() {
      const endpoint = 'testendpoint';
      const args = { version: 1 };
      const reply = {
        prop: randomString()
      };
      nock(this.client.baseUrl)
        .post(`/${rpcNamespace}/${this.client.appKey}/custom/${endpoint}`, body => {
          let allowed = true;
          const keys = Object.keys(args);

          for (const key of keys) {
            allowed = body[key] === args[key];
          }

          return allowed;
        })
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return CustomEndpoint.execute(endpoint, args).then(response => {
        expect(response).to.deep.equal(reply);
      });
    });
  });
});
