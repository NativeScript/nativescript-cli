import { expect } from 'chai';
import nock from 'nock';
import { register as registerHttp } from 'kinvey-http-node';
import { randomString } from 'kinvey-test-utils';
import { init } from 'kinvey-app';
import { ping } from './ping';

before(() => {
  registerHttp();
});

describe('ping()', () => {
  it('should return a response', () => {
    const reply = {
      version: 1,
      kinvey: 'hello tests',
      appName: 'tests',
      environmentName: 'development'
    };
    const config = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com"
    });

    nock(config.apiHostname)
      .get(`/appdata/${config.appKey}`)
      .reply(200, reply);

    return ping()
      .then((response) => {
        expect(response).to.deep.equal(reply);
      });
  });
});
