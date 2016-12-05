import { Client } from 'src/client';
import { randomString } from 'src/utils';
import expect from 'expect';

describe('Client', () => {
  describe('constructor', () => {
    it('should be able to create an instance', () => {
      const client = new Client();
      expect(client).toBeA(Client);
      expect(client.apiHostname).toEqual('https://baas.kinvey.com');
      expect(client.micHostname).toEqual('https://auth.kinvey.com');
      expect(client.liveServiceHostname).toEqual('https://kls.kinvey.com');
    });

    it('should be able to provide custom apiHostname', () => {
      const apiHostname = 'https://mybaas.kinvey.com';
      const client = new Client({ apiHostname: apiHostname });
      expect(client.apiHostname).toEqual(apiHostname);
    });

    it('should be able to provide custom micHostname', () => {
      const micHostname = 'https://myauth.kinvey.com';
      const client = new Client({ micHostname: micHostname });
      expect(client.micHostname).toEqual(micHostname);
    });

    it('should be able to provide custom liveServiceHostname', () => {
      const liveServiceHostname = 'https://mylive.kinvey.com';
      const client = new Client({ liveServiceHostname: liveServiceHostname });
      expect(client.liveServiceHostname).toEqual(liveServiceHostname);
    });

    it('should be able to provide an appKey', () => {
      const appKey = randomString();
      const client = new Client({ appKey: appKey });
      expect(client.appKey).toEqual(appKey);
    });

    it('should be able to provide an appSecret', () => {
      const appSecret = randomString();
      const client = new Client({ appSecret: appSecret });
      expect(client.appSecret).toEqual(appSecret);
    });

    it('should be able to provide an masterSecret', () => {
      const masterSecret = randomString();
      const client = new Client({ masterSecret: masterSecret });
      expect(client.masterSecret).toEqual(masterSecret);
    });

    it('should be able to provide an encryptionKey', () => {
      const encryptionKey = randomString();
      const client = new Client({ encryptionKey: encryptionKey });
      expect(client.encryptionKey).toEqual(encryptionKey);
    });

    it('should be able to provide an appVersion', () => {
      const appVersion = randomString();
      const client = new Client({ appVersion: appVersion });
      expect(client.appVersion).toEqual(appVersion);
    });
  });

  describe('appVersion', function() {
    it('should set the appVersion', function() {
      const appVersion = randomString();
      const client = new Client();
      client.appVersion = appVersion;
      expect(client.appVersion).toEqual(appVersion);
    });
  });
});
