import { KinveyRackManager } from '../../rack/rack';
import { HttpMiddleware } from '../../rack/http';
import { TestHttpMiddleware } from '../../rack/test/http';
import { NetworkRequest, StatusCode } from '../index';
import test from 'ava';
import nock from 'nock';
const url = 'http://test.com';

test.before(() => {
  KinveyRackManager.networkRack.swap(HttpMiddleware, new TestHttpMiddleware());
});

test('rack is set to the network rack', t => {
  const request = new NetworkRequest();
  t.deepEqual(request.rack, KinveyRackManager.networkRack);
});

test('automaticallyRefreshAuthToken is true by default', t => {
  const request = new NetworkRequest();
  t.true(request.automaticallyRefreshAuthToken);
});

test('a response is eventually returned', async t => {
  nock(url)
    .get('/')
    .query(true)
    .reply(200, {}, {
      'content-type': 'application/json'
    });

  const request = new NetworkRequest({
    url: url
  });
  const response = await request.execute();
  t.is(response.statusCode, StatusCode.Ok);
  t.deepEqual(response.headers.toJSON(), { 'content-type': ['application/json'] });
  t.deepEqual(response.data, {});
});
