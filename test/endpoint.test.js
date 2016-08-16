import { CustomEndpoint } from '../src/endpoint';
import { KinveyError, NotFoundError } from '../src/errors';
import expect from 'expect';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

describe('Endpoint', () => {
  it('should not be able to create and instance', () => {
    expect(() => {
      const endpoint = new CustomEndpoint();
      return endpoint;
    }).toThrow();
  });

  it('should throw a KinveyError when an endpoint argument is not provided', async () => {
    try {
      await CustomEndpoint.execute();
    } catch (error) {
      expect(error).toBeA(KinveyError);
    }
  });

  it('should throw a KinveyError when the endpoint argument is not a string', async () => {
    try {
      await CustomEndpoint.execute({});
    } catch (error) {
      expect(error).toBeA(KinveyError);
    }
  });

  it('should throw NotFoundError for a custom endpoint that does not exist', async () => {
    try {
      await CustomEndpoint.execute('doesnotexist');
    } catch (error) {
      expect(error).toBeA(NotFoundError);
    }
  });

  it('should execute a custom endpoint and return the response', async () => {
    const response = await CustomEndpoint.execute('test');
    expect(response).toEqual({ message: 'Hello, World!' });
  });

  it('should execute a custom endpoint with args and return the response', async () => {
    const args = { message: 'Hello, Tests!' };
    const response = await CustomEndpoint.execute('test', args);
    expect(response).toEqual(args);
  });
});
