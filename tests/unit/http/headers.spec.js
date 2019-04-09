import { expect } from 'chai';
import { Headers, KinveyHeaders } from './headers';

const HEADER = { name: 'Content-Type', value: 'application/json' };

describe('Headers', () => {
  let headers = new Headers();

  afterEach(() => {
    headers = new Headers();
  });

  describe('has()', () => {
    beforeEach(() => {
      headers.set(HEADER.name, HEADER.value);
    });

    it('should return false', () => {
      expect(headers.has('Content-Length')).to.be.false;
    });

    it('should return true', () => {
      expect(headers.has(HEADER.name)).to.be.true;
    });
  });

  describe('get()', () => {
    beforeEach(() => {
      headers.set(HEADER.name, HEADER.value);
    });

    it('should return undefined', () => {
      expect(headers.get('Content-Length')).to.be.undefined;
    });

    it('should return the header value', () => {
      expect(headers.get(HEADER.name)).to.equal(HEADER.value);
    });
  });

  describe('keys()', () => {
    beforeEach(() => {
      headers.set(HEADER.name, HEADER.value);
    });

    it('should return all the header names', () => {
      expect(headers.keys()).to.deep.equal([HEADER.name]);
    });
  });

  describe('set()', () => {
    it('should throw an error if a name is not provided', () => {
      expect(() => {
        headers.set(null, '');
      }).to.throw('Please provide a name. Name must be a string.');
    });

    it('should throw an error if the name is not a string', () => {
      expect(() => {
        headers.set({}, '');
      }).to.throw('Please provide a name. Name must be a string.');
    });

    it('should throw an error if a value is not provided', () => {
      expect(() => {
        headers.set('');
      }).to.throw('Please provide a value. Value must be a string or an array that contains only strings.');
    });

    it('should throw an error if the value is not a string', () => {
      expect(() => {
        headers.set('', {});
      }).to.throw('Please provide a value. Value must be a string or an array that contains only strings.');
    });

    it('should throw an error if the value is an array that does not contain only strings', () => {
      expect(() => {
        headers.set('', ['', {}]);
      }).to.throw('Please provide a value. Value must be a string or an array that contains only strings.');
    });

    it('should set the header', () => {
      expect(headers.set(HEADER.name, HEADER.value)).to.deep.equal(headers);
      expect(headers.get(HEADER.name)).to.equal(HEADER.value);
    });

    it('should set the header with an array of values', () => {
      expect(headers.set(HEADER.name, [HEADER.value, HEADER.value])).to.deep.equal(headers);
      expect(headers.get(HEADER.name)).to.equal(`${HEADER.value},${HEADER.value}`);
    });
  });

  describe('delete()', () => {
    beforeEach(() => {
      headers.set(HEADER.name, HEADER.value);
    });

    it('should return false', () => {
      expect(headers.delete('Content-Length')).to.be.false;
    });

    it('should return true', () => {
      expect(headers.delete(HEADER.name)).to.be.true;
    });
  });

  describe('toObject()', () => {
    it('should return an empty object', () => {
      expect(headers.toObject()).to.deep.equal({});
    });

    it('should return an object with all headers', () => {
      const anotherHeader = { name: 'x-custom', value: ['foo', 'bar'] }
      const headersObject = {};
      headersObject[HEADER.name] = HEADER.value;
      headersObject[anotherHeader.name] = anotherHeader.value.join(',');
      headers.set(HEADER.name, HEADER.value);
      headers.set(anotherHeader.name, anotherHeader.value);
      expect(headers.toObject()).to.deep.equal(headersObject);
    });
  });
});

describe('KinveyHeaders', () => {
  let headers = new KinveyHeaders();

  describe('requestStart', () => {
    it('should return undefined', () => {
      expect(headers.requestStart).to.be.undefined;
    });

    it('should return a value', () => {
      const requestStart = new Date().toISOString();
      headers.set('X-Kinvey-Request-Start', requestStart);
      expect(headers.requestStart).to.equal(requestStart);
    });
  });

  describe('setAuthorization()', () => {//TODO setAuthorization() is not a function
    it('should throw an error if no info is provided', () => {
      expect(() => {
        headers.setAuthorization();
      }).to.throw(/Please provide valid authorization info. The authorization info must have a scheme that is a string./);
    });

    it('should throw an error if the scheme is missing', () => {
      expect(() => {
        headers.setAuthorization({});
      }).to.throw(/Please provide valid authorization info. The authorization info must have a scheme that is a string./);
    });

    it('should throw an error if the scheme is not a string', () => {
      expect(() => {
        headers.setAuthorization({ scheme: {} });
      }).to.throw(/Please provide valid authorization info. The authorization info must have a scheme that is a string./);
    });

    it('should throw an error if the credentials are missing', () => {
      expect(() => {
        headers.setAuthorization({ scheme: 'test' });
      }).to.throw(/Please provide valid authorization info. The authorization info must contain either a username and password or credentials./);
    });

    it('should set the Authorization header using credentials', () => {
      const info = {
        scheme: 'test',
        credentials: 'foo'
      };
      headers.setAuthorization(info);
      expect(headers.get('Authorization')).to.equal(`${info.scheme} ${info.credentials}`);
    });

    it('should set the Authorization header using a username and password', () => {
      const info = {
        scheme: 'test',
        username: 'foo',
        password: 'bar'
      };
      headers.setAuthorization(info);
      expect(headers.get('Authorization')).to.equal(`${info.scheme} ${Buffer.from(`${info.username}:${info.password}`).toString('base64')}`);
    });
  });

  describe('setAppAuthorization()', () => {// TODO setAppAuthorization is not a function
    it('should throw an error if no appKey is provided', () => {
      expect(() => {
        headers.setAppAuthorization();
      }).to.throw(/Please provide a valid appKey and appSecret. The appKey and appSecret must be a string./);
    });

    it('should throw an error if no appSecret is provided', () => {
      expect(() => {
        headers.setAppAuthorization('test');
      }).to.throw(/Please provide a valid appKey and appSecret. The appKey and appSecret must be a string./);
    });

    it('should set the Authorization header with the provided appKey and appSecret', () => {
      const appKey = 'test';
      const appSecret = 'foo';
      headers.setAppAuthorization(appKey, appSecret);
      expect(headers.get('Authorization')).to.equal(`Basic ${Buffer.from(`${appKey}:${appSecret}`).toString('base64')}`);
    });
  });

  describe('setSessionAuthorization()', () => {// TODO setSessionAuthorization is  not a function
    it('should throw an error if no session is provided', () => {
      expect(() => {
        headers.setSessionAuthorization();
      }).to.throw(/Please provide a valid auth token. The auth token must be a string./);
    });

    it('should throw an error if the session does not have an authtoken', () => {
      expect(() => {
        headers.setSessionAuthorization({});
      }).to.throw(/Please provide a valid auth token. The auth token must be a string./);
    });

    it('should throw an error if the session authtoken is not a string', () => {
      expect(() => {
        headers.setSessionAuthorization({ authtoken: {} });
      }).to.throw(/Please provide a valid auth token. The auth token must be a string./);
    });

    it('should set the Authorization header with the provided session', () => {
      const authtoken = 'foo';
      headers.setSessionAuthorization(authtoken);
      expect(headers.get('Authorization')).to.equal(`Kinvey ${authtoken}`);
    });
  });
});
