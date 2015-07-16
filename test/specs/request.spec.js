require('../setup');
import Request from '../../src/core/request';
import Auth from '../../src/core/auth';

describe('Request', function() {
  beforeEach(function() {
    this.request = new Request();
  });

  it(`should be a class`, function() {
    Request.should.be.a.Function();
  });

  describe('headers property', function() {
    it('should not exist', function() {
      should.not.exist(this.request.headers);
    });
  });

  describe('method property', function() {
    it('should exist', function() {
      should.exist(this.request.method);
    });

    it('should be set to GET by default', function() {
      this.request.method.should.equal('GET');
    });

    it('should be set to the provided method in the constructor', function() {
      let method = 'POST';
      let request = new Request(method);
      request.method.should.equal(method);
    });

    it('should be able to be set after creating a request', function() {
      let method = 'POST';
      this.request.method = method;
      this.request.method.should.equal(method);
    });

    it('should throw an error for an invalid method', function() {
      (function() {
        return new Request('foo');
      }).should.throw('Invalid Http Method. OPTIONS, GET, POST, PATCH, PUT, and DELETE are allowed.');
    });
  });

  describe('protocol property', function() {
    it('should exist', function() {
      should.exist(this.request.protocol);
    });

    it(`should be set to ${process.env.API_PROTOCOL} by default`, function() {
      this.request.protocol.should.equal(this.kinvey.apiProtocol);
    });

    it('should be able to be set to a different value', function() {
      let protocol = 'foo';
      this.request.protocol = protocol;
      this.request.protocol.should.equal(protocol);
    });
  });

  describe('hostname property', function() {
    it('should exist', function() {
      should.exist(this.request.hostname);
    });

    it(`should be set to ${process.env.API_HOSTNAME} by default`, function() {
      this.request.hostname.should.equal(this.kinvey.apiHostname);
    });

    it('should be able to be set to a different value', function() {
      let hostname = 'foo.com';
      this.request.hostname = hostname;
      this.request.hostname.should.equal(hostname);
    });
  });

  describe('auth property', function() {
    it('should exist', function() {
      should.exist(this.request.auth);
    });

    it('should be set to Auth.None by default', function() {
      this.request.auth.should.equal(Auth.none);
    });

    it('should be able to be set to a different value', function() {
      let auth = {};
      this.request.auth = auth;
      should.deepEqual(this.request.auth, auth);
    });
  });

  describe('path property', function() {
    it('should exist', function() {
      should.exist(this.request.path);
    });

    it('should be equal to an empty string by default', function() {
      this.request.path.should.equal('');
    });

    it('should be set to the provided path in the constructor', function() {
      let path = '/foo';
      let request = new Request('GET', path);
      request.path.should.equal(path);
    });

    it('should be able to be set to a different value', function() {
      let path = '/foo';
      this.request.path = path;
      should.deepEqual(this.request.path, path);
    });
  });

  describe('query property', function() {
    it('should exist', function() {
      should.exist(this.request.query);
    });
  });

  describe('body property', function() {
    it('should not exist', function() {
      should.not.exist(this.request.body);
    });

    it('should not be able to be set', function() {
      (function() {
        this.request.body = {};
      }).should.throw();
    });
  });

  describe('response property', function() {
    it('should not exist', function() {
      should.not.exist(this.request.response);
    });

    it('should not be able to be set', function() {
      (function() {
        this.request.response = {};
      }).should.throw();
    });
  });

  describe('getHeader function', function() {
    it('should respond', function() {
      this.request.getHeader.should.be.a.Function();
    });

    it('should have Accept header set to application/json by default', function() {
      this.request.getHeader('Accept').should.equal('application/json');
    });

    it('should have Content-Type header set to application/json by default', function() {
      this.request.getHeader('Content-Type').should.equal('application/json');
    });

    it(`should have X-Kinvey-Api-Version header set to ${process.env.API_VERSION} by default`, function() {
      this.request.getHeader('X-Kinvey-Api-Version').should.equal(this.kinvey.apiVersion);
    });
  });

  describe('setHeader function', function() {
    it('should respond', function() {
      this.request.setHeader.should.be.a.Function();
    });

    it('should add the header', function() {
      let header = 'foo';
      let value = 'bar';
      this.request.setHeader(header, value);
      this.request.getHeader(header).should.equal(value);
    });

    it('should replace an existing header', function() {
      let header = 'content-type';
      let value = 'application/xml';
      this.request.setHeader(header, value);
      this.request.getHeader(header).should.equal(value);
    });

    it('should throw an error if header value is not a string');
    it('should throw an error if the header value is to large');
  });

  describe('addHeaders function', function() {
    it('should respond', function() {
      this.request.addHeaders.should.be.a.Function();
    });

    it('should add the headers', function() {
      let headers = {
        foo: 'bar',
        hello: 'world'
      };
      this.request.addHeaders(headers);
      this.request.getHeader('foo').should.equal(headers.foo);
      this.request.getHeader('hello').should.equal(headers.hello);
    });

    it('should replace existing headers', function() {
      let headers = {
        accept: 'application/xml'
      };
      this.request.addHeaders(headers);
      this.request.getHeader('accept').should.equal(headers.accept);
    });

    it('should throw an error if header value is not a string');
    it('should throw an error if the header value is to large');
  });

  describe('removeHeader function', function() {
    it('should respond', function() {
      this.request.removeHeader.should.be.a.Function();
    });

    it('should remove a header', function() {
      this.request.removeHeader('content-type');
      should.not.exist(this.request.getHeader('content-type'));
    });
  });

  describe('isCacheEnabled function', function() {
    it('should be a function', function() {
      this.request.isCacheEnabled.should.be.a.Function();
    });

    it('should return a boolean', function() {
      this.request.isCacheEnabled().should.be.a.Boolean();
    });
  });

  describe('enabledCache function', function() {
    it('should be a function', function() {
      this.request.enableCache.should.be.a.Function();
    });

    it('should enable the cache', function() {
      this.request.enableCache();
      this.request.isCacheEnabled().should.be.true;
    });
  });

  describe('disableCache function', function() {
    it('should be a function', function() {
      this.request.disableCache.should.be.a.Function();
    });

    it('should disable the cache', function() {
      this.request.disableCache();
      this.request.isCacheEnabled().should.be.false;
    });
  });

  describe('execute function', function() {
    it('should be a function', function() {
      this.request.execute.should.be.a.Function();
    });

    it('should return a promise', function() {
      this.request.execute().should.be.a.Promise();
    });
  });

  describe('toJSON function', function() {
    it('should respond', function() {
      this.request.toJSON.should.be.a.Function();
    });
  });
});
