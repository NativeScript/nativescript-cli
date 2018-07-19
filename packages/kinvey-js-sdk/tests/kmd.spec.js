import { expect } from 'chai';
import Kmd from '../src/kmd';
import { randomString } from './utils';

describe('Kmd', () => {
  describe('createdAt', () => {
    it('should return undefined', () => {
      const kmd = new Kmd();
      expect(kmd.createdAt).to.equal(undefined);
    });

    it('should return a Date', () => {
      const ect = new Date().toISOString();
      const kmd = new Kmd({ ect });
      expect(kmd.createdAt).to.deep.equal(new Date(ect));
    });
  });

  describe('ect', () => {
    it('should return undefined', () => {
      const kmd = new Kmd();
      expect(kmd.ect).to.equal(undefined);
    });

    it('should return a Date', () => {
      const ect = new Date().toISOString();
      const kmd = new Kmd({ ect });
      expect(kmd.ect).to.deep.equal(new Date(ect));
    });
  });

  describe('emailVerification', () => {
    it('should return undefined', () => {
      const kmd = new Kmd();
      expect(kmd.emailVerification).to.equal(undefined);
    });

    it('should return value', () => {
      const emailVerification = { status: 'Verified' };
      const kmd = new Kmd({ emailVerification });
      expect(kmd.emailVerification).to.equal(emailVerification);
    });
  });

  describe('lastModified', () => {
    it('should return undefined', () => {
      const kmd = new Kmd();
      expect(kmd.lastModified).to.equal(undefined);
    });

    it('should return a Date', () => {
      const lmt = new Date().toISOString();
      const kmd = new Kmd({ lmt });
      expect(kmd.lastModified).to.deep.equal(new Date(lmt));
    });
  });

  describe('lmt', () => {
    it('should return undefined ', () => {
      const kmd = new Kmd();
      expect(kmd.lmt).to.equal(undefined);
    });

    it('should return a Date', () => {
      const lmt = new Date().toISOString();
      const kmd = new Kmd({ lmt });
      expect(kmd.lmt).to.deep.equal(new Date(lmt));
    });
  });

  describe('authtoken', () => {
    it('should return undefined', () => {
      const kmd = new Kmd();
      expect(kmd.authtoken).to.equal(undefined);
    });

    it('should return authtoken value', () => {
      const authtoken = randomString();
      const kmd = new Kmd({ authtoken });
      expect(kmd.authtoken).to.equal(authtoken);
    });
  });

  describe('isLocal()', () => {
    it('should return false', () => {
      const kmd = new Kmd({ local: false });
      expect(kmd.isLocal()).to.equal(false);
    });

    it('should return true', () => {
      const kmd = new Kmd({ local: true });
      expect(kmd.isLocal()).to.equal(true);
    });
  });
});
