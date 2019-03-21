import { expect } from 'chai';
import nock from 'nock';
import init from './kinvey/init';
import ping from './ping';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

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
