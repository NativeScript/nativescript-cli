(function() {
  'use strict';

  var chai = require('chai');
  chai.use(require('chai-as-promised'));// Apply chai-as-promised extension.
  chai.use(require('sinon-chai'));//Apply sinon-chai extension.
  var expect = chai.expect;
  var nock = require('nock');
  var Kinvey = require('./../dist/publish/kinvey-nodejs-1.2.1');
  require('./../dist/intermediate/config.js');

  describe('Example', function() {

    it('should work', function() {
      expect(true).to.be.true;
    });

    describe('Network Request', function() {
      before(function() {
        var promise = Kinvey.init({
          apiHostName: 'https://v3yk1n-kcs.kinvey.com',
          appKey    : 'kid_byW23pLgR',
          appSecret : '15e67b69e76540c2984cbcb77d8de763'
        });
        return promise.then(null, function(error) {
          // Do not fail if the active user was deleted via the console.
          if (Kinvey.Error.INVALID_CREDENTIALS === error.name) {
            Kinvey.setActiveUser(null); // Reset.
            return null;
          }
          return Kinvey.Defer.reject(error);
        });
      });

      afterEach(function() {
        Kinvey.appKey = 'kid_byW23pLgR';
        Kinvey.appSecret = '15e67b69e76540c2984cbcb77d8de763';
      });

      before(function() {
        var api = nock('https://v3yk1n-kcs.kinvey.com')
          .filteringPath(/(&)?_=([^&]*)/, '')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/user/kid_byW23pLgR/login/?', '*')
          .reply(200, {
            _id: '5526bacf3f82f0a517c4f024',
            username: 'test',
            _kmd: {
              lmt: '2015-04-09T17:45:51.780Z',
              ect: '2015-04-09T17:45:51.780Z',
              authtoken: '66e82c49-e71f-4074-97c8-17f77d8e2ce4.2O5DPC/r8XzyYEQs7KOP9d0faQnHPkVN1e3KKVNhqxE='
            },
            _acl: {
              creator: '5526bacf3f82f0a517c4f024'
            }
          }, {
            server: 'ngx_openresty',
            date: 'Thu, 09 Apr 2015 17:47:01 GMT',
            'content-type': 'application/json; charset=utf-8',
            'content-length': '269',
            connection: 'close',
            'x-powered-by': 'Express',
            'x-kinvey-request-id': '5205b4751ebe482682253a14ab116371',
            'x-kinvey-api-version': '3'
          });

        return Kinvey.User.login('test', 'test').then(function(user) {
          expect(user._id).to.exist;
          expect(api.isDone()).to.be.true;
        });
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should respond with an empty array of books', function() {
        var api = nock('https://v3yk1n-kcs.kinvey.com')
          .filteringPath(/(&)?_=([^&]*)/, '')
          .get('/appdata/kid_byW23pLgR/books/?kinveyfile_tls=true')
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
