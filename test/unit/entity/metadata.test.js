import { Metadata } from 'src/entity';
import { randomString } from 'src/utils';
import expect from 'expect';

describe('Metadata', function() {
  describe('createdAt', function() {
    it('should return undefined for entity create time', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.createdAt).toEqual(undefined);
    });

    it('should return a Date for entity create time', function() {
      const ect = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { ect: ect } });
      expect(metadata.createdAt).toBeA(Date);
      expect(metadata.createdAt).toEqual(new Date(ect));
    });
  });

  describe('ect', function() {
    it('should return undefined for entity create time', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.ect).toEqual(undefined);
    });

    it('should return a Date for entity create time', function() {
      const ect = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { ect: ect } });
      expect(metadata.ect).toBeA(Date);
      expect(metadata.ect).toEqual(new Date(ect));
    });
  });

  describe('emailVerification', function() {
    it('should return undefined', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.emailVerification).toEqual(undefined);
    });

    it('should return emailVerification.status value', function() {
      const emailVerificationStatus = 'Verified';
      const metadata = new Metadata({ _kmd: { emailVerification: { status: emailVerificationStatus } } });
      expect(metadata.emailVerification).toEqual(emailVerificationStatus);
    });
  });

  describe('lastModified', function() {
    it('should return undefined for entity create time', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.lastModified).toEqual(undefined);
    });

    it('should return a Date for entity create time', function() {
      const lmt = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { lmt: lmt } });
      expect(metadata.lastModified).toBeA(Date);
      expect(metadata.lastModified).toEqual(new Date(lmt));
    });
  });

  describe('lmt', function() {
    it('should return undefined for entity create time', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.lmt).toEqual(undefined);
    });

    it('should return a Date for entity create time', function() {
      const lmt = new Date().toISOString();
      const metadata = new Metadata({ _kmd: { lmt: lmt } });
      expect(metadata.lmt).toBeA(Date);
      expect(metadata.lmt).toEqual(new Date(lmt));
    });
  });

  describe('authtoken', function() {
    it('should return undefined', function() {
      const metadata = new Metadata({ _kmd: {} });
      expect(metadata.authtoken).toEqual(undefined);
    });

    it('should return authtoken value', function() {
      const authtoken = randomString();
      const metadata = new Metadata({ _kmd: { authtoken: authtoken } });
      expect(metadata.authtoken).toEqual(authtoken);
    });
  });

  describe('isLocal()', function() {
    it('should return false', function() {
      const metadata = new Metadata({ _kmd: { local: false } });
      expect(metadata.isLocal()).toEqual(false);
    });

    it('should return true', function() {
      const metadata = new Metadata({ _kmd: { local: true } });
      expect(metadata.isLocal()).toEqual(true);
    });
  });

  describe('toPlainObject()', function() {
    it('should return object', function() {
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
