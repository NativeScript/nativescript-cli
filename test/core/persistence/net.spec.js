/**
 * Test suite for `Kinvey.Persistence.Net` adapters.
 *
 */
describe('Kinvey.Persistence.Net', function() {

  /**
   * `Kinvey.Persistence.Net.request`
   */
  describe('the request method', function() {
    // Housekeeping: set target URL.
    before(function() {
      this.url = Kinvey.API_ENDPOINT + '/appdata';
    });
    after(function() {// Cleanup.
      delete this.url;
    });

    // Test suite.
    it('should return a promise.', function() {
      var promise = Kinvey.Persistence.Net.request('GET', this.url);
      return expect(promise).to.eventually;// Fails if not a promise.
    });

    it('should issue a successful GET request.', function() {
      var promise = Kinvey.Persistence.Net.request('GET', this.url).then(function(value) {
        value = JSON.parse(value);
        expect(value).to.be.an('object');
        expect(value).to.have.property('kinvey');
        expect(value).to.have.property('version');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should issue a failing GET request.', function() {
      var promise = Kinvey.Persistence.Net.request('GET', this.url + '/' + Math.random());
      return expect(promise).to.be.rejected;
    });
    it('should issue a successful POST request.');
    it('should issue a failing POST request.', function() {
      var promise = Kinvey.Persistence.Net.request('POST', this.url);
      return expect(promise).to.be.rejected;
    });
    it('should issue a successful PUT request.');
    it('should issue a failing PUT request.', function() {
      var promise = Kinvey.Persistence.Net.request('PUT', this.url);
      return expect(promise).to.be.rejected;
    });
    it('should issue a successful DELETE request.');
    it('should issue a failing DELETE request.', function() {
      var promise = Kinvey.Persistence.Net.request('DELETE', this.url);
      return expect(promise).to.be.rejected;
    });

    // Options.
    describe('the timeout option', function() {
      it('should be ignored if the request completes in time.', function() {
        var promise = Kinvey.Persistence.Net.request('GET', this.url, null, {}, {
          timeout: 30000// 30s should be plenty.
        });
        return expect(promise).to.be.fulfilled;
      });
      it('should abort the request if exceeded.', function() {
        var promise = Kinvey.Persistence.Net.request('GET', this.url, null, {}, {
          timeout: 1// Ridiculously small timeout.
        });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function(error) {
          expect(error).to.equal('timeout');
        });
      });
    });

  });

});