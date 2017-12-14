testRunner.run(testFunc);

function testFunc() {
  var expect = chai.expect;
  Kinvey.initialize({
    appKey: 'kid_H1yZOGnfb',
    appSecret: '174b6b64eef645fd8dd77a5ba2366ad0'
  });

  describe.skip('Ping', function () {
    it('should return version', function (done) {
      var promise = Kinvey.ping().then(function (response) {
        expect(response.version).to.equal('3.9.38');
        done();
      }).catch(function (error) {
        done(error);
      });
    });
  });
}