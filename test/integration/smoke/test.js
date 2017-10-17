function testFunc() {
  var expect = chai.expect;
  Kinvey.initialize({
    appKey: 'sample-appKey',
    appSecret: 'sample-appSecret'
  });

  describe('Ping', function () {
    it('should return version', function (done) {
      var promise = Kinvey.ping()
        .then(function (response) {
          expect(response.version).to.equal('3.9.44');
          done();
        })
        .catch(function (error) {
          done(error);
        });
    });
  });
}
