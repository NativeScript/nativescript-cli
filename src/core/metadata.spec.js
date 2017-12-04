import expect from 'expect';
import { Metadata } from './metadata';
import { randomString } from './utils';
import { KinveyError } from './errors';

describe('Metadata', () => {
  describe('constructor', () => {
    it('should throw an error if an entity is not provided', () => {
      expect(() => {
        const metadata = new Metadata();
        return metadata;
      }).toThrow(KinveyError, /entity argument must be an object/);
    });

    it('should create an empty metadata when the entity does not contain an _kmd property', () => {
      const entity = {};
      const metadata = new Metadata(entity);
      expect(metadata.toPlainObject()).toEqual({});
      expect(entity._kmd).toEqual({});
    });

    it('should use the _kmd property on the entity', () => {
      const kmdProp = { lmt: randomString() };
      const entity = { _kmd: kmdProp };
      const metadata = new Metadata(entity);
      expect(metadata.toPlainObject()).toEqual(kmdProp);
      expect(entity._kmd).toEqual(kmdProp);
    });
  });

  describe('createdAt', () => {
    it('should return undefined for entity create time', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.createdAt).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const ect = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { ect: ect } });
      expect(metadata.createdAt).toBeA(Date);
      expect(metadata.createdAt).toEqual(new Date(ect));
    });
  });

  describe('ect', () => {
    it('should return undefined for entity create time', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.ect).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const ect = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { ect: ect } });
      expect(metadata.ect).toBeA(Date);
      expect(metadata.ect).toEqual(new Date(ect));
    });
  });

  describe('emailVerification', () => {
    it('should return undefined', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.emailVerification).toEqual(undefined);
    });

    it('should return emailVerification.status value', () => {
      const emailVerificationStatus = 'Verified';
      const metadata = new Metadata({ _kmd: { emailVerification: { status: emailVerificationStatus } } });
      expect(metadata.emailVerification).toEqual(emailVerificationStatus);
    });
  });

  describe('lastModified', () => {
    it('should return undefined for entity create time', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.lastModified).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const lmt = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { lmt: lmt } });
      expect(metadata.lastModified).toBeA(Date);
      expect(metadata.lastModified).toEqual(new Date(lmt));
    });
  });

  describe('lmt', () => {
    it('should return undefined for entity create time', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.lmt).toEqual(undefined);
    });

    it('should return a Date for entity create time', () => {
      const lmt = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { lmt: lmt } });
      expect(metadata.lmt).toBeA(Date);
      expect(metadata.lmt).toEqual(new Date(lmt));
    });
  });

  describe('authtoken', () => {
    it('should return undefined', () => {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.authtoken).toEqual(undefined);
    });

    it('should return authtoken value', () => {
      const authtoken = randomString();
      const metadata = new Metadata({ _kmd: { authtoken: authtoken } });
      expect(metadata.authtoken).toEqual(authtoken);
    });
  });

  describe('isLocal()', () => {
    it('should return false', () => {
      const metadata = new Metadata({ _kmd: { local: false } });
      expect(metadata.isLocal()).toEqual(false);
    });

    it('should return true', () => {
      const metadata = new Metadata({ _kmd: { local: true } });
      expect(metadata.isLocal()).toEqual(true);
    });
  });

  describe('toPlainObject()', () => {
    it('should return object', () => {
      const kmd = {
        local: false,
        authtoken: randomString(),
        emailVerification: {
          status: 'Verified'
        }
      };
      const metadata = new Metadata({ _kmd: kmd });
      expect(metadata.toPlainObject()).toEqual(kmd);
    });
  });
});
