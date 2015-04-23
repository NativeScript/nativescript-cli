(function() {
  'use strict';

  // Require helper.spec.js
  require('./../helper.spec');

  // ----------------------------------------------
  // Tests
  // ----------------------------------------------

  describe('KCS Protocol', function() {
    describe('Content-Type Header', function() {
      it('should throw error when missing with response data', function() {
        var api = nock(Kinvey.APIHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/' + Kinvey.appKey + '/books/?kinveyfile_tls=true')
          .reply(200, []);

        return Kinvey.DataStore.find('books').then(null, function(err) {
          expect(err.debug.message).to.equal('Content-Type header missing in response. Please add Content-Type header to response with value application/json.');
          expect(api.isDone()).to.be.true;
        });
      });

      it('should throw error when not \'application/json\' with response data', function() {
        var api = nock(Kinvey.APIHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/' + Kinvey.appKey + '/books/?kinveyfile_tls=true')
          .reply(200, [], {
            'content-type': 'application/xml'
          });

        return Kinvey.DataStore.find('books').then(null, function(err) {
          expect(err.debug.message).to.equal('Response Content-Type header is set to application/xml. Expected it to be set to application/json.');
          expect(api.isDone()).to.be.true;
        });
      });
    });

    describe('Single Entity', function() {
      it('should throw error when expecting a single entity but received mutiple entities', function() {
        var api = nock(Kinvey.APIHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/' + Kinvey.appKey + '/books/1/?kinveyfile_tls=true')
          .reply(200, [], {
            'content-type': 'application/json'
          });

        return Kinvey.DataStore.get('books', 1).then(null, function(err) {
          expect(err).to.not.be.undefined;
          expect(api.isDone()).to.be.true;
        });
      });
    });

    describe('Mutiple Entities', function() {
      it('should throw error when expecting mutiple entities but received a single entity', function() {
        var api = nock(Kinvey.APIHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/' + Kinvey.appKey + '/books/?kinveyfile_tls=true')
          .reply(200, {}, {
            'content-type': 'application/json'
          });

        return Kinvey.DataStore.find('books').then(null, function(err) {
          expect(err).to.not.be.undefined;
          expect(api.isDone()).to.be.true;
        });
      });
    });
  });
})();
