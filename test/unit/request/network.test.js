import Request, { KinveyRequest } from 'core/request';
import { Client } from 'core/client';
import { TimeoutError } from 'common/errors';
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
});
