/* eslint-env mocha */

import * as chai from 'chai';
import { Kinvey } from '../../../src/angular2/kinvey';
import { KinveyError } from '../../../src/core/errors';
import { randomString } from '../../../src/core/utils';

chai.use(require('chai-as-promised'));
const { expect } = chai;

describe('Angular2:Kinvey', () => {
  describe('initialize()', () => {
    it('should throw an error if no appKey is provided', () => {
      const promise = Kinvey.initialize({
        appSecret: randomString()
      })
        .catch((error) => {
          expect(error).to.be.an.instanceof(KinveyError);
          throw error;
        });
      return expect(promise).to.be.rejected;
    });

    it('should throw an error if no appSecret is provided', () => {
      const promise = Kinvey.initialize({
        appKey: randomString()
      })
        .catch((error) => {
          expect(error).to.be.an.instanceof(KinveyError);
          throw error;
        });
      return expect(promise).to.be.rejected;
    });
  });

  describe(('init'), () => {
    it('should throw an error if no appKey is provided', () => {
      expect(() => {
        return Kinvey.init({
          appSecret: randomString()
        });
      }).to.throw(KinveyError, /No App Key/);
    });

    it('should throw an error if no appSecret is provided', () => {
      expect(() => {
        return Kinvey.init({
          appKey: randomString()
        });
      }).to.throw(KinveyError, /No App Secret/);
    });
  });
});
