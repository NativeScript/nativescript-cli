import { KinveyRackManager } from '../../rack/rack';
import { HttpMiddleware } from '../../rack/http';
import { TestHttpMiddleware } from '../../rack/test/http';
import { StatusCode } from './request';
import { NetworkRequest } from './network';
import { NotFoundError } from '../../errors';
import test from 'ava';
import nock from 'nock';
const url = 'http://test.com';

test.before(() => {
  KinveyRackManager.networkRack.swap(HttpMiddleware, new TestHttpMiddleware());
});

// test.after(() => {
//   KinveyRackManager.networkRack.swap(TestHttpMiddleware, new HttpMiddleware());
// });

test('rack is set to the network rack', t => {
  const request = new NetworkRequest();
  t.deepEqual(request.rack, KinveyRackManager.networkRack);
});

test('refreshAuthToken is true by default', t => {
  const request = new NetworkRequest();
  t.true(request.refreshAuthToken);
});

test('a response is returned', async t => {
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

test('a NotFoundError should be thrown', async t => {
  nock(url)
    .get('/')
    .query(true)
    .reply(404, { name: 'EntityNotFound' }, {
      'content-type': 'application/json'
    });

  const request = new NetworkRequest({
    url: url
  });

  try {
    await request.execute();
  } catch (error) {
    t.is(error.code, StatusCode.NotFound);
    t.true(error instanceof NotFoundError);
  }
});
