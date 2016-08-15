import { CustomEndpoint } from '../src/endpoint';
import expect from 'expect';

describe('Endpoint', () => {
  it('should not be able to create and instance of the class', () => {
    expect(() => {
      const endpoint = new CustomEndpoint();
      return endpoint;
    }).toThrow();
  });
});
