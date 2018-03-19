

function testFunc() {
  const { collectionName } = externalConfig;

  function setCookie(aa, cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() - (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    var domain = 'domain=.facebook.com';
    var newVal = `${cname}=${cvalue};${expires};${domain};path=/`;
    console.log('new: ', newVal);
    aa.document.cookie = newVal;
  }

  const createdUserIds = [];



  before((done) => {
    utilities.cleanUpAppData(collectionName, createdUserIds)
      .then((user) => {
        createdUserIds.push(user.data._id);
        done();
      })
      .catch(done);
  });

  after((done) => {
    utilities.cleanUpAppData(collectionName, createdUserIds)
      .then(() => done())
      .catch(done);
  });

  describe.only('MIC', () => {
    let winOpen;
    beforeEach((done) => {
      var fbWindow = window.open('https://developers.facebook.com');
      fbWindow.addEventListener("load", function () {
        setCookie(fbWindow, 'c_user', '1172498488', 3);
        fbWindow.close();
        done();
      });
    });

    afterEach((done) => {
      window.open = winOpen;
      done();
    });


    it('first', (done) => {
      winOpen = window.open;
      window.open = function () {
        var win = winOpen.apply(this, arguments);
        windows.push(win);
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

    it('second', (done) => {
      winOpen = window.open;
      window.open = function () {
        var win = winOpen.apply(this, arguments);
        windows.push(win);
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
