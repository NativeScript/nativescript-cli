import { KinveyMiddleware } from '../../../src/rack';
import expect from 'expect';

describe('KinveyMiddleware', function() {
  describe('constructor', function() {
    it('should set the name to \'Kinvey Middleware\'', function() {
      expect(new KinveyMiddleware().name).toEqual('Kinvey Middleware');
    });
  });
});
