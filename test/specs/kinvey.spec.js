const Kinvey = require('../../src/kinvey');

describe('Kinvey', function() {
  describe('init()', function() {
    it('should respond', function() {
      expect(Kinvey).itself.to.respondTo('init');
    });
  });
});
