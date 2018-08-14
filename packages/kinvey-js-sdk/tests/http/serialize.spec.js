import { expect, use } from 'chai';
import serialize from '../../src/http/serialize';
import { Request, RequestMethod } from '../../src/http/request';

// Register chai-as-promised
use(require('chai-as-promised'));

// Body
const BODY = { test: 'foo' };

describe('serialize()', () => {
  it('should throw an error if no request is provided', () => {
    expect(serialize()).to.eventually.be.rejectedWith(/No request provided./);
  });

  describe('unrecognized Content-Type', () => {
    const xmlRequest = new Request({
      headers: { 'Content-Type': 'application/xml' },
      method: RequestMethod.POST,
      url: 'http://test.com',
      body: BODY
    });

    it('should return the request unchanged', async () => {
      const serializedRequest = await serialize(xmlRequest);
      expect(serializedRequest).to.deep.equal(xmlRequest);
    });
  });

  describe('Content-Type: application/x-www-form-urlencoded', () => {
    const formRequest = new Request({
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: RequestMethod.POST,
      url: 'http://test.com',
      body: BODY
    });

    it('should serialize the body', async () => {

      const serializedRequest = await serialize(formRequest);
      expect(serializedRequest.headers).to.deep.equal(formRequest.headers);
      expect(serializedRequest.method).to.deep.equal(formRequest.method);
      expect(serializedRequest.url).to.deep.equal(formRequest.url);

      const str = [];
      Object.keys(BODY).forEach((key) => {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(BODY[key])}`);
      });
      const formBody = str.join('&');

      expect(serializedRequest.body).to.equal(formBody);
    });
  });

  describe('Content-Type: application/json', () => {
    const jsonRequest = new Request({
      headers: { 'Content-Type': 'application/json' },
      method: RequestMethod.POST,
      url: 'http://test.com',
      body: BODY
    });

    it('should serialize the body', async () => {
      const serializedRequest = await serialize(jsonRequest);
      expect(serializedRequest.headers).to.deep.equal(jsonRequest.headers);
      expect(serializedRequest.method).to.deep.equal(jsonRequest.method);
      expect(serializedRequest.url).to.deep.equal(jsonRequest.url);
      expect(serializedRequest.body).to.equal(JSON.stringify(BODY));
    });
  });
});
