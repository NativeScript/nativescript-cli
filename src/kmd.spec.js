import expect from 'expect';
import { randomString } from '../tests/utils';
import KinveyError from './errors/kinvey';
import Kmd from './kmd';

describe('kmd', () => {
  describe('constructor', () => {// TODO: errors should be reverted
    it('should throw an error if an entity is not provided', () => {
      expect(() => {
        const kmd = new Kmd();
        return kmd;
      }).toThrow(KinveyError, /entity argument must be an object/);
    });

    it('should create an empty kmd when the entity does not contain an _kmd property', () => {//TODO: toPlainObject is not a function
      const entity = {};
      const kmd = new Kmd(entity);
      expect(kmd.toPlainObject()).toEqual({});
      expect(entity._kmd).toEqual({});
    });

    it('should use the _kmd property on the entity', () => {//TODO: toPlainObject is not a function also kmd is not in the root object but in the entity prop
      const kmdProp = { lmt: randomString() };
      const entity = { _kmd: kmdProp };
      const kmd = new Kmd(entity);
      expect(kmd.toPlainObject()).toEqual(kmdProp);
      expect(entity._kmd).toEqual(kmdProp);
    });
  });

  describe('createdAt', () => {
    it('should return undefined for entity create time', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.createdAt).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const ect = new Date().toISOString();
      const kmd = new Kmd({ _kmd: { ect: ect } });
      expect(kmd.createdAt).toBeA(Date);
      expect(kmd.createdAt).toEqual(new Date(ect));
    });
  });

  describe('ect', () => {
    it('should return undefined for entity create time', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.ect).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const ect = new Date().toISOString();
      const kmd = new Kmd({ _kmd: { ect: ect } });
      expect(kmd.ect).toBeA(Date);
      expect(kmd.ect).toEqual(new Date(ect));
    });
  });

  describe('emailVerification', () => {//TODO: returns {status:verified} used to return verified
    it('should return undefined', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.emailVerification).toEqual(undefined);
    });

    it('should return emailVerification.status value', () => {
      const emailVerificationStatus = 'Verified';
      const kmd = new Kmd({ _kmd: { emailVerification: { status: emailVerificationStatus } } });
      expect(kmd.emailVerification).toEqual(emailVerificationStatus);
    });
  });

  describe('lastModified', () => {
    it('should return undefined for entity create time', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.lastModified).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const lmt = new Date().toISOString();
      const kmd = new Kmd({ _kmd: { lmt: lmt } });
      expect(kmd.lastModified).toBeA(Date);
      expect(kmd.lastModified).toEqual(new Date(lmt));
    });
  });

  describe('lmt', () => {
    it('should return undefined for entity create time', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.lmt).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const lmt = new Date().toISOString();
      const kmd = new Kmd({ _kmd: { lmt: lmt } });
      expect(kmd.lmt).toBeA(Date);
      expect(kmd.lmt).toEqual(new Date(lmt));
    });
  });

  describe('authtoken', () => {
    it('should return undefined', () => {
      const kmd = new Kmd({ _kmd: {} });
      expect(kmd.authtoken).toEqual(undefined);
    });

    it('should return authtoken value', () => {
      const authtoken = randomString();
      const kmd = new Kmd({ _kmd: { authtoken: authtoken } });
      expect(kmd.authtoken).toEqual(authtoken);
    });
  });

  describe('isLocal()', () => {
    it('should return false', () => {
      const kmd = new Kmd({ _kmd: { local: false } });
      expect(kmd.isLocal()).toEqual(false);
    });

    it('should return true', () => {
      const kmd = new Kmd({ _kmd: { local: true } });
      expect(kmd.isLocal()).toEqual(true);
    });
  });

  describe('toPlainObject()', () => {
    it('should return object', () => {//TODO: toPlainObject is not a function
      const kmd = {
        local: false,
        authtoken: randomString(),
        emailVerification: {
          status: 'Verified'
        }
      };
      const kmd_metadata = new Kmd({ _kmd: kmd });
      expect(kmd_metadata.toPlainObject()).toEqual(kmd);
    });
  });
});
