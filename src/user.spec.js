import { User } from './user';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('User', function () {
  describe('login()', function () {
    it('should respond', function () {
      expect(User).itself.to.respondTo('login');
    });
  });
});
