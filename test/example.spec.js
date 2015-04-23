(function() {
  'use strict';

  // Require helper.spec.js
  require('./helper.spec.js');

  // ----------------------------------------------
  // Tests
  // ----------------------------------------------

  describe('Example', function() {
    describe('Network Request', function() {
      it('should respond with an empty array of books', function() {
        var api = nock(apiHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/' + appKey + '/books/?kinveyfile_tls=true')
          .reply(200, [], {
            server: 'ngx_openresty',
            date: 'Thu, 09 Apr 2015 17:22:45 GMT',
            'content-type': 'application/json; charset=utf-8',
            'content-length': '2',
            connection: 'close',
            'x-powered-by': 'Express',
            'x-kinvey-request-id': 'a667bf8b4c7747dfa3a8690a5b66602b',
            'x-kinvey-api-version': '3'
          });

        return Kinvey.DataStore.find('books').then(function(books) {
          expect(books).to.be.instanceof(Array);
          expect(books.length).to.be.equal(0);
          expect(api.isDone()).to.be.true;
        });
      });
    });
  });
})();
