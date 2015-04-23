(function() {
  'use strict';

  // Require helper.spec.js
  require('./../helper.spec');

  // ----------------------------------------------
  // Tests
  // ----------------------------------------------

  describe('Kinvey.User.MIC', function() {
    var redirectUri = 'http://example.com/callback';
    var username = 'test';
    var password = 'test';

    before(function() {
      return logout();
    });

    it('should exist', function() {
      expect(Kinvey.User.MIC).to.be.exist;
    });

    describe('#loginWithAuthorizationCodeLoginPage()', function() {

      it('should respond', function() {
        expect(Kinvey.User.MIC).itself.to.respondTo('loginWithAuthorizationCodeLoginPage');
      });

      it('should reject with no redirectUri', function() {
        return expect(Kinvey.User.MIC.loginWithAuthorizationCodeLoginPage(null)).to.be.rejected;
      });

      it('should reject because popup was blocked');
      it('should reject because authorization timeout');
      it('should reject because popup was closed');
      it('should fulfill with a user');
    });

    describe('#loginWithAuthorizationCodeAPI()', function() {
      it('should respond', function() {
        expect(Kinvey.User.MIC).itself.to.respondTo('loginWithAuthorizationCodeAPI');
      });

      it('should reject with no username', function() {
        return expect(Kinvey.User.MIC.loginWithAuthorizationCodeAPI(null, password, redirectUri)).to.be.rejected;
      });

      it('should reject with no password', function() {
        return expect(Kinvey.User.MIC.loginWithAuthorizationCodeAPI(username, null, redirectUri)).to.be.rejected;
      });

      it('should reject with no redirectUri', function() {
        return expect(Kinvey.User.MIC.loginWithAuthorizationCodeAPI(username, password, null)).to.be.rejected;
      });

      it('should reject because of incorrect credentials', function() {
        var tempLoginUriPath = '/' + randomId();
        var api = nock(Kinvey.MICHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/oauth/auth', '*')
          .reply(200, {
            'temp_login_uri': Kinvey.MICHostName + tempLoginUriPath
          }, {
            'content-type': 'application/json; charset=utf-8'
          })
          .post(tempLoginUriPath, '*')
          .reply(403);

        return Kinvey.User.MIC.loginWithAuthorizationCodeAPI('tester', 'tester', redirectUri).catch(function(error) {
          expect(error).to.deep.equal({
            name: 'MIC_ERROR',
            debug: 'Unable to authorize user with username tester and password tester.',
            description: 'Unable to authorize using Mobile Identity Connect.'
          });
          expect(api.isDone()).to.be.true;
        });
      });

      it('should fulfill with a user', function() {
        var tempLoginUriPath = '/' + randomId();
        var code = randomId();
        var token = {
          'access_token': randomId(),
          'refresh_token': randomId(),
          'expires_in': 10,
          type: 'Bearer'
        };
        var user = {
          _id: '552d11380030f69153053ace',
          _socialIdentity: {
            kinveyAuth: {
              'access_token': 'f3d5611f2a450f896ab4df76f36bd484214873b1',
              id: 'mjs',
              audience: 'kid_WyYCSd34p',
              'client_token': '33266b57-8c35-48de-991f-fe4e6173553d'
            }
          },
          username: '17984003-2b56-411e-94b9-e15cf58f1f2b',
          _kmd: {
            lmt: '2015-04-14T13:08:08.380Z',
            ect: '2015-04-14T13:08:08.380Z',
            authtoken: '10e1d468-caad-46df-9ade-72014d739480.NCaoNCHf3xleom1YxUFD43Bc+A7fcBPZiNtNf/fZ2IA='
          },
          _acl: {
            creator: '552d11380030f69153053ace'
          }
        };

        // Nock MIC
        var mic = nock(Kinvey.MICHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/oauth/auth', '*')
          .reply(200, {
            'temp_login_uri': Kinvey.MICHostName + tempLoginUriPath
          }, {
            'content-type': 'application/json; charset=utf-8'
          })
          .post(tempLoginUriPath, '*')
          .reply(302, undefined, {
            location: redirectUri + '/?code=' + code
          })
          .post('/oauth/token', '*')
          .reply(200, token, {
            'content-type': 'application/json; charset=utf-8'
          });

        // Nock API
        var api = nock(Kinvey.APIHostName)
          .filteringPath(/(&)?_=([^&]*)/, '')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/user/' + Kinvey.appKey + '/login/?', '*')
          .reply(200, user, {
            'content-type': 'application/json; charset=utf-8'
          });

        return Kinvey.User.MIC.loginWithAuthorizationCodeAPI(username, password, redirectUri).then(function(authorizedUser) {
          expect(authorizedUser).to.not.be.null;
          expect(authorizedUser).to.deep.equal(user);
          expect(mic.isDone()).to.be.true;
          expect(api.isDone()).to.be.true;
        });
      });
    });

    describe('#logout()', function() {
      it('should respond', function() {
        expect(Kinvey.User.MIC).itself.to.respondTo('logout');
      });
    });
  });
})();
