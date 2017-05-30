import Client from 'src/client';
import { randomString } from 'src/utils';
import expect from 'expect';
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 60000;

describe('Client', () => {
  describe('constructor', () => {
    it('should be able to create an instance', () => {
      const client = new Client();
      expect(client).toBeA(Client);
      expect(client.apiHostname).toEqual('https://baas.kinvey.com');
      expect(client.micHostname).toEqual('https://auth.kinvey.com');
      expect(client.liveServiceHostname).toEqual('https://kls.kinvey.com');
    });

    it('should be able to provide custom apiHostname with protocol https:', () => {
      const apiHostname = 'https://mybaas.kinvey.com';
      const client = new Client({ apiHostname: apiHostname });
      expect(client.apiHostname).toEqual(apiHostname);
    });

    it('should be able to provide custom apiHostname with protocol http:', () => {
      const apiHostname = 'http://mybaas.kinvey.com';
      const client = new Client({ apiHostname: apiHostname });
      expect(client.apiHostname).toEqual(apiHostname);
    });

    it('should be able to provide custom apiHostname without protocol', () => {
      const apiHostname = 'myauth.kinvey.com';
      const client = new Client({ apiHostname: apiHostname });
      expect(client.apiHostname).toEqual(`https://${apiHostname}`);
    });

    it('should be able to provide custom micHostname with protocol https:', () => {
      const micHostname = 'https://myauth.kinvey.com';
      const client = new Client({ micHostname: micHostname });
      expect(client.micHostname).toEqual(micHostname);
    });

    it('should be able to provide custom micHostname with protocol http:', () => {
      const micHostname = 'http://myauth.kinvey.com';
      const client = new Client({ micHostname: micHostname });
      expect(client.micHostname).toEqual(micHostname);
    });

    it('should be able to provide custom micHostname without protocol', () => {
      const micHostname = 'myauth.kinvey.com';
      const client = new Client({ micHostname: micHostname });
      expect(client.micHostname).toEqual(`https://${micHostname}`);
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

    it('should be able to provide a defaultTimeout', () => {
      const timeout = 1;
      const client = new Client({ defaultTimeout: timeout });
      expect(client.defaultTimeout).toEqual(timeout);
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

  describe('defaultTimeout', function() {
    it('should throw an Error if it is not a Number', function() {
      expect(() => {
        const timeout = 'foo';
        const client = new Client({ defaultTimeout: timeout });
        return client;
      }).toThrow(/Invalid timeout. Timeout must be a number./);
    });

    it(`should set default timeout to ${defaultTimeout}ms`, function() {
      const client = new Client();
      expect(client.defaultTimeout).toEqual(defaultTimeout);
    });

    it(`should use ${defaultTimeout}ms when defaultTimeout is less than 0`, function() {
      const client = new Client({ defaultTimeout: -1 });
      expect(client.defaultTimeout).toEqual(defaultTimeout);
    });

    it('should set the defaultTimeout to 1', function() {
      const timeout = 1;
      const client = new Client({ defaultTimeout: timeout });
      expect(client.defaultTimeout).toEqual(timeout);
    });
  });
});
