function testFunc() {

  const { collectionName } = externalConfig;
  const networkstore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
  const createdUserIds = [];
  const fbEmail = 'system.everlive@gmail.com';
  const fbPassword = 'f9737dc075';
  const fbDevUrl = 'https://developers.facebook.com';
  const fbCookieName = 'c_user';
  const fbCookieValue = '1172498488';
  const redirectUrl = 'http://localhost:64320/callback';
  const fbUserName = 'Gaco Baco';
  const authServiceId = 'f16b10fac0e64ed4ac6c33ce26a21b68';

  // Currently the server returns refresh_token = 'null' if the auth service does not allow refresh tokens.
  // The tests should be changed when this is fixed on the server
  const notAllowedRefreshTokenValue = 'null';
  let winOpen;

  const expireFBCookie = (fbWindow, cookieName, cookieValue, expiredDays) => {
    const newDate = new Date();
    newDate.setTime(newDate.getTime() - (expiredDays * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + newDate.toUTCString();
    const domain = 'domain=.facebook.com';
    const newValue = `${cookieName}=${cookieValue};${expires};${domain};path=/`;
    fbWindow.document.cookie = newValue;
  }

  const validateMICUser = (user, allowRefreshTokens, explicitAuthServiceId) => {
    expect(user).to.deep.equal(Kinvey.User.getActiveUser());

    const userData = user.data;
    const kinveyAuth = userData._socialIdentity.kinveyAuth;
    const metadata = userData._kmd;

    expect(userData._id).to.exist;
    expect(userData.username).to.exist;
    expect(userData._acl.creator).to.exist;
    expect(metadata.lmt).to.exist;
    expect(metadata.ect).to.exist;
    expect(metadata.authtoken).to.exist;

    expect(kinveyAuth.id).to.exist;
    expect(kinveyAuth.name).to.equal(fbUserName);
    expect(kinveyAuth.access_token).to.exist;

    if (allowRefreshTokens) {
      expect(typeof kinveyAuth.refresh_token).to.equal('string');
      expect(kinveyAuth.refresh_token).to.not.equal(notAllowedRefreshTokenValue);
    }
    else {
      expect(kinveyAuth.refresh_token).to.equal(notAllowedRefreshTokenValue);
    }

    expect(kinveyAuth.token_type).to.equal('Bearer');
    expect(kinveyAuth.expires_in).to.equal(3599);
    expect(kinveyAuth.id_token).to.exist;
    expect(kinveyAuth.identity).to.equal('kinveyAuth');
    if (explicitAuthServiceId) {
      expect(kinveyAuth.client_id).to.equal(`${externalConfig.appKey}.${authServiceId}`);
    }
    else {
      expect(kinveyAuth.client_id).to.equal(externalConfig.appKey);
    }
    expect(kinveyAuth.redirect_uri).to.equal(redirectUrl);
    expect(kinveyAuth.protocol).to.equal('https:');
    expect(kinveyAuth.host).to.equal('auth.kinvey.com');

    expect(user.client).to.exist;
  };

  const loginFacebook = () => {
    // monkey patch window.open - the function is reset back in the afterEach hook
    window.open = function () {
      const fbPopup = winOpen.apply(this, arguments);
      fbPopup.addEventListener('load', function () {
        const setIntervalVar = setInterval(function () {
          const email = fbPopup.document.getElementById('email')
          const pass = fbPopup.document.getElementById('pass')
          const loginButton = fbPopup.document.getElementById('loginbutton')
          if (email && pass && loginButton) {
            email.value = fbEmail;
            pass.value = fbPassword;
            loginButton.click();
            clearInterval(setIntervalVar);
          }
        }, 1000);
      });
      return fbPopup;
    };
  }

  describe('MIC Integration', () => {

    before((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => done())
        .catch(done);
    });

    after((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => done())
        .catch(done);
    });

    beforeEach((done) => {
      Kinvey.User.logout()
        .then(() => {
          var fbWindow = window.open(fbDevUrl);
          fbWindow.addEventListener('load', function () {
            expireFBCookie(fbWindow, fbCookieName, fbCookieValue, 3);
            fbWindow.close();
            winOpen = window.open;
            done();
          });
        });
    });

    afterEach((done) => {
      window.open = winOpen;

      done();
    });


    it('should login the user, using the default Auth service, which allows refresh tokens', (done) => {
      loginFacebook();
      Kinvey.User.loginWithMIC(redirectUrl)
        .then((user) => {
          validateMICUser(user, true);
          createdUserIds.push(user.data._id);
        })
        .then((user) => {
          return networkstore.find().toPromise()
        })
        .then((result) => {
          expect(result).to.be.an.empty.array;
          done();
        })
        .catch(done);
    });

    it('should login the user, using the specified Auth service, which does not allow refresh tokens', (done) => {
      loginFacebook();
      Kinvey.User.loginWithMIC(redirectUrl, Kinvey.AuthorizationGrant.AuthorizationCodeLoginPage, { micId: authServiceId })
        .then((user) => {
          validateMICUser(user, false, true);
          createdUserIds.push(user.data._id);
        })
        .then((user) => {
          return networkstore.find().toPromise()
        })
        .then((result) => {
          expect(result).to.be.an.empty.array;
          done();
        })
        .catch(done);
    });

    it('should return a meaningful error if the user cancels the login', (done) => {
      window.open = function () {
        const fbPopup = winOpen.apply(this, arguments);
        fbPopup.addEventListener('load', function () {
          fbPopup.close();
        });
        return fbPopup;
      };

      Kinvey.User.loginWithMIC(redirectUrl)
        .then(() => done(new Error('Should not happen')))
        .catch((err) => {
          expect(err.message).to.equal('Login has been cancelled.');
          done();
        });
    });
  });
}

runner.run(testFunc);
