import Request, { KinveyRequest } from '../../../src/request';
import { Client } from '../../../src/client';
import { TimeoutError } from '../../../src/errors';
import url from 'url';
import nock from 'nock';
import expect from 'expect';

describe('KinveyRequest', () => {
  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new KinveyRequest();
      expect(request).toBeA(KinveyRequest);
      expect(request).toBeA(Request);
    });
  });

  describe('execute()', () => {
    it('should refresh an expired MIC token');
    // it('should refresh MIC token', async function() {
    //   // Get the active user
    //   const activeUser = await CacheRequest.getActiveUser(this.client);

    //   // Create the request
    //   const request = new KinveyRequest({
    //     method: RequestMethod.GET,
    //     authType: AuthType.Session,
    //     url: url.format({
    //       protocol: this.client.protocol,
    //       host: this.client.host,
    //       pathname: '/foo'
    //     }),
    //     client: this.client
    //   });

    //   // Login a user with MIC
    //   // Send a request that results in a 401
    //   // Refresh the MIC token
    //   // Check that new request is sent with updated credentials

    //   // Kinvey API Response
    //   nock(request.client.baseUrl, { encodedQueryParams: true })
    //     .matchHeader('authorization', `Kinvey ${activeUser._kmd.authtoken}`)
    //     .get('/foo')
    //     .query(true)
    //     .reply(200, '', {
    //       'content-type': 'application/json; charset=utf-8'
    //     });

    //   const response = await request.execute();
    // });
  });

  it('should timeout', function() {
    const defaultTimeout = 1000;
    const client = new Client({
      defaultTimeout: defaultTimeout
    });

    // Setup nock response
    nock(client.apiHostname, { encodedQueryParams: true })
      .get('/foo')
      .delay(defaultTimeout + 1)
      .reply(200, null, {
        'Content-Type': 'application/json; charset=utf-8'
      });

    const request = new KinveyRequest({
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: '/foo'
      }),
      client: client
    });
    return request.execute()
      .catch((error) => {
        expect(error).toBeA(TimeoutError);
        expect(error.name).toEqual('TimeoutError');
        expect(error.message).toEqual('The request timed out.');
      });
  });
});
