function testFunc() {

  const { collectionName } = externalConfig;
  const createdUserIds = [];
  const fbDevUrl = 'https://developers.facebook.com';
  fbCookieName = 'c_user';
  fbCookieValue = '1172498488';

  const expireFBCookie = (fbWindow, cookieName, cookieValue, expiredDays) => {
    const newDate = new Date();
    newDate.setTime(newDate.getTime() - (expiredDays * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + newDate.toUTCString();
    const domain = 'domain=.facebook.com';
    const newValue = `${cookieName}=${cookieValue};${expires};${domain};path=/`;
    fbWindow.document.cookie = newValue;
  }

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
        done();
      });
    });

    afterEach((done) => {
      window.open = winOpen;
      done();
    });


    it('should login the user, using the default MIC service', (done) => {
      winOpen = window.open;
      window.open = function () {
        var win = winOpen.apply(this, arguments);
        win.addEventListener('load', function () {
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

    it('second', (done) => {
      winOpen = window.open;
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
