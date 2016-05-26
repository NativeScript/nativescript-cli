import '../setup';
import Client from '../../src/client';
import { KinveyRequest, KinveyRequestConfig } from '../../src/requests/request';
import chai from 'chai';
const expect = chai.expect;

describe('KinveyRequest', function () {
  describe('headers', function() {
    it('should have set X-Kinvey-Client-App-Version header', function() {
      const appVersion = '1.0.0';
      const client = new Client({
        appVersion: appVersion
      });
      const config = new KinveyRequestConfig({
        client: client
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const appVersionHeader = headers.get('X-Kinvey-Client-App-Version');
      expect(appVersionHeader).to.equal(appVersion);
    });

    it('should have not set X-Kinvey-Client-App-Version header', function() {
      const client = new Client();
      const config = new KinveyRequestConfig({
        client: client
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const appVersionHeader = headers.get('X-Kinvey-Client-App-Version');
      expect(appVersionHeader).to.be.undefined;
    });
  });
});
