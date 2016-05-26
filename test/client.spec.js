import './setup';
import Client from '../src/client';
import chai from 'chai';
const expect = chai.expect;

describe('Client', function () {
  describe('constructor', function() {
    it('should set the appVersion', function() {
      const appVersion = '1.0.0';
      const client = new Client({
        appVersion: appVersion
      });
      expect(client.appVersion).to.equal(appVersion);
    });
  });

  describe('appVersion', function() {
    it('should set the appVersion', function() {
      const appVersion = '1.0.0';
      const client = new Client();
      client.appVersion = appVersion;
      expect(client.appVersion).to.equal(appVersion);
    });
  });
});
