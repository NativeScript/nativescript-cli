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

  const expireFBCookie = (fbWindow, cookieName, cookieValue, expiredDays) => {
    const newDate = new Date();
    newDate.setTime(newDate.getTime() - (expiredDays * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + newDate.toUTCString();
    const domain = 'domain=.facebook.com';
    const newValue = `${cookieName}=${cookieValue};${expires};${domain};path=/`;
    fbWindow.document.cookie = newValue;
  }

  const validateMICUser = (user, expectedRefreshToken) => {
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
    expect(kinveyAuth.audience).to.equal(externalConfig.appKey);
    expect(kinveyAuth.name).to.equal(fbUserName);
    expect(kinveyAuth.access_token).to.exist;
    expect(kinveyAuth.refresh_token).to.equal(expectedRefreshToken);

    expect(kinveyAuth.token_type).to.equal('Bearer');
    expect(kinveyAuth.expires_in).to.equal(3599);
    expect(kinveyAuth.id_token).to.exist;
    expect(kinveyAuth.identity).to.equal('kinveyAuth');
    expect(kinveyAuth.client_id).to.equal(externalConfig.appKey);
    expect(kinveyAuth.redirect_uri).to.equal(redirectUrl);
    expect(kinveyAuth.protocol).to.equal('https:');
    expect(kinveyAuth.host).to.equal('auth.kinvey.com');

    expect(user.client).to.exist;
  };

  describe('MIC Integration', () => {
    let winOpen;

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
      var fbWindow = window.open(fbDevUrl);
      fbWindow.addEventListener('load', function () {
        expireFBCookie(fbWindow, fbCookieName, fbCookieValue, 3);
        fbWindow.close();
        winOpen = window.open;
        done();
      });
    });

    afterEach((done) => {
      window.open = winOpen;
      done();
    });


    it('should login the user, using the default MIC service', (done) => {
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

      Kinvey.User.logout()
        .then(() => {
          return Kinvey.User.loginWithMIC(redirectUrl);
        })
        .then((user) => {
          validateMICUser(user, 'null');
        })
        .then((user) => {
          return networkstore.find().toPromise()
        })
        .then((result) => {
          debugger
          expect(result).to.be.an.empty.array
          done();
        })
        .catch(done);
    });

    it('second', (done) => {
      window.open = function () {
        var win = winOpen.apply(this, arguments);
        win.addEventListener("load", function () {
          var myVar = setInterval(function () {

            var email = win.document.getElementById('email')
            var pass = win.document.getElementById('pass')
            var loginButton = win.document.getElementById('loginbutton')
            if (email && pass && loginButton) {
              email.value = "system.everlive@gmail.com"
              pass.value = "f9737dc075"
              loginButton.click();
              clearInterval(myVar);
            }
          }, 1000);

        });
        return win;
      };

      Kinvey.User.logout()
        .then(() => {
          return Kinvey.User.loginWithMIC('http://localhost:64320/callback')
        })
        .then((result) => {
          console.log(result);
          console.log('finished');
          done();
        },
        (err) => {
          console.log('errrrrrrrrrrrrrrrr: ')
          done(err);
        });
    });
  });
}

runner.run(testFunc);
