import { expect } from 'chai';
import Response from '../../src/http/response';

describe('Response', () => {
  describe('error', () => {
    it('should return null', () => {
      const response = new Response({
        statusCode: 200,
        data: {}
      });
      const error = response.error;
      expect(response.isSuccess()).to.be.true;
      expect(error).to.be.null;
    });

    it('should return an error', () => {
      const apiError = { name: 'InsufficientCredentialsError', message: 'Insufficient Credentials' };
      const response = new Response({ statusCode: 401, data: apiError });
      const error = response.error;
      expect(response.isSuccess()).to.be.false;
      expect(error).to.be.instanceOf(Error);
      expect(error.name).to.equal('InsufficientCredentialsError');
      expect(error.message).to.equal(apiError.message);
      expect(error.code).to.equal(401);
    });
  });
});
