const Kinvey = require('../../src/kinvey');

describe('Kinvey', function() {
  describe('init()', function() {
    it('should respond', function() {
      console.log(this.client);
      expect(Kinvey).itself.to.respondTo('init');
    });
  });
});
