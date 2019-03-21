import nock from 'nock';
import expect from 'expect';
import KinveyError from './errors/kinvey';
import NotFoundError from './errors/notFound';
import login from './user/login';
import init from './kinvey/init';
import endpoint from './endpoint';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

describe('Endpoint', () => {
  let client;

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: 'https://baas.kinvey.com'
    });
  });

  before(() => {
    const username = randomString();
    const password = randomString();
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: username,
      _acl: {
        creator: randomString()
      }
    };

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return login(username, password);
  });

  describe('constructor', () => {
    it('should not be able to create an instance of the endpoint class', () => {
      expect(() => {
        const endpoint = new endpoint();
        return endpoint;
      }).toThrow();
    });
  });

  describe('execute()', () => {
    it('should throw a KinveyError when an endpoint argument is not provided', () => {
      return endpoint()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError when the endpoint argument is not a string', () => {
      return endpoint({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw NotFoundError for a custom endpoint that does not exist', () => {//TODO: Errors shpuld ne reverted
      // Setup nock response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${client.appKey}/custom/doesnotexist`)
        .reply(404, {
          error: 'EndpointDoesNotExist',
          description: 'The custom endpoint you tried to access does not exist.'
            + ' Please configure custom Business Logic endpoints through the Kinvey Console.',
          debug: ''
        });

      // Execute custom endpoint
      return endpoint('doesnotexist')
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should execute a custom endpoint and return the response', () => {
      // Setup nock response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${client.appKey}/custom/test`)
        .reply(200, {
          message: 'Hello, World!'
        }, {
            'content-type': 'application/json; charset=utf-8',
            'content-length': '27',
            'x-kinvey-request-id': '85ada36c8c0a40a18b2016e1554147d5',
            'x-kinvey-api-version': '4'
          });

      // Execute custom endpoint
      return endpoint('test')
        .then((response) => {
          expect(response).toEqual({ message: 'Hello, World!' });
        });
    });

    it('should execute a custom endpoint with args and return the response', () => {
      const args = { message: 'Hello, Tests!' };

      // Setup nock response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${client.appKey}/custom/test`)
        .reply(200, args, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '27',
          'x-kinvey-request-id': 'e71d9d14412e4f1eab803a915b4b71cd',
          'x-kinvey-api-version': '4'
        });

      // Execute custom endpoint
      return endpoint('test', args)
        .then((response) => {
          expect(response).toEqual(args);
        });
    });
  });
});
