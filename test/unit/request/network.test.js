import Request, { KinveyRequest } from '../../../src/request';
import expect from 'expect';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

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
});
