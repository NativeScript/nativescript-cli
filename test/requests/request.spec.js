import '../setup';
import Client from '../../src/client';
import { Properties, KinveyRequest, KinveyRequestConfig } from '../../src/requests/request';
import chai from 'chai';
const expect = chai.expect;

describe('KinveyRequest', function () {
  describe('headers', function() {
    it('should set Content-Type header to application/json; charset=utf-8', function() {
      const config = new KinveyRequestConfig();
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('Content-Type');
      expect(header).to.equal('application/json; charset=utf-8');
    });

    it('should set Content-Type header to application/xml', function() {
      const config = new KinveyRequestConfig({
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('Content-Type');
      expect(header).to.equal('application/xml');
    });

    it('should set X-Kinvey-Custom-Request-Properties header', function() {
      const properties = new Properties({ foo: 'bar' });
      const config = new KinveyRequestConfig({
        properties: properties
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('X-Kinvey-Custom-Request-Properties');
      expect(header).to.equal(properties.toString());
    });

    it('should not set X-Kinvey-Custom-Request-Properties header', function() {
      const config = new KinveyRequestConfig();
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('X-Kinvey-Custom-Request-Properties');
      expect(header).to.be.undefined;
    });

    it('should set X-Kinvey-Client-App-Version header', function() {
      const appVersion = '1.0.0';
      const client = new Client({
        appVersion: appVersion
      });
      const config = new KinveyRequestConfig({
        client: client
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('X-Kinvey-Client-App-Version');
      expect(header).to.equal(appVersion);
    });

    it('should not set X-Kinvey-Client-App-Version header', function() {
      const client = new Client();
      const config = new KinveyRequestConfig({
        client: client
      });
      const request = new KinveyRequest(config);
      const headers = request.headers;
      const header = headers.get('X-Kinvey-Client-App-Version');
      expect(header).to.be.undefined;
    });
  });
});
