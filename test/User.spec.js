/**
 * Kinvey.User test suite.
 */
describe('Kinvey.User', function() {

  // Inheritance
  it('extends Kinvey.Entity.', function() {
    var user = new Kinvey.User();
    user.should.be.an.instanceOf(Kinvey.Entity);
    user.should.be.an.instanceOf(Kinvey.User);
  });
  it('is extendable.', function() {
    var SuperUser = Kinvey.User.extend();
    (new SuperUser()).should.be.an.instanceOf(Kinvey.User);
  });

  // Kinvey.User::create
  describe('::create', function() {
    // Each test below creates a user, cleanup after.
    afterEach(function(done) {
      this.user.destroy(callback(done));
    });

    // Test suite.
    it('creates the current user.', function(done) {
      var user = this.user = Kinvey.User.create({
        username: 'foo',
        password: 'bar',
        attribute: 'value'
      }, callback(done, {
        success: function(response) {
          response.should.equal(user);// Kinvey.User
          (response.getUsername()).should.equal('foo');
          (response.getPassword()).should.equal('bar');
          (response.get('attribute')).should.equal('value');

          // Test current user.
          Kinvey.getCurrentUser().should.equal(response);
          response.isLoggedIn.should.be['true'];

          done();
        }
      }));
    });
    it('creates the current user with auto-generated password.', function(done) {
      var user = this.user = Kinvey.User.create({
        username: 'foo'
      }, callback(done, {
        success: function(response) {
          response.should.equal(user);
          (response.getUsername()).should.equal('foo');
          (null !== response.getPassword()).should.be['true'];

          // Test current user.
          Kinvey.getCurrentUser().should.equal(response);
          (response.isLoggedIn).should.be['true'];

          done();
        }
      }));
    });
    it('creates an anonymous current user.', function(done) {
      var user = this.user = Kinvey.User.create({}, callback(done, {
        success: function(response) {
          response.should.equal(user);
          (null !== response.getUsername()).should.be['true'];
          (null !== response.getPassword()).should.be['true'];

          // Test current user.
          Kinvey.getCurrentUser().should.equal(response);
          (response.isLoggedIn).should.be['true'];

          done();
        }
      }));
    });
  });

  // Kinvey.User::init
  describe('::init', function() {
    // Destroy the created anonymous user.
    afterEach(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    it('returns the current user.', function(done) {
      // Create a current user.
      Kinvey.User.create({}, callback(done, {
        success: function(user) {
          Kinvey.User.init(callback(done, {
            success: function(response) {
              response.should.equal(user);

              // Test current user.
              Kinvey.getCurrentUser().should.equal(response);
              (response.isLoggedIn).should.be['true'];

              done();
            }
          }));
        }
      }));
    });
    it('restored a cached user.', function(done) {
      Kinvey.User.create({}, callback(done, {
        success: function(user) {
          // Manually reset current user, so cache keeps intact.
          Kinvey.setCurrentUser(null);

          // Restore should recreate the user from cache.
          Kinvey.User._restore();
          Kinvey.getCurrentUser().should.eql(user);

          done();
        }
      }));
    });
    it('creates an anonymous user.', function(done) {
      // Create spy.
      var create = Kinvey.User.create;
      Kinvey.User.create = function() {
        invoked = true;
        return create.apply(this, arguments);
      };
      var invoked = false;

      // Init should internally call the spy defined above.
      var user = Kinvey.User.init(callback(done, {
        success: function(response) {
          // Reset spy.
          Kinvey.User.create = create;

          invoked.should.be['true'];
          response.should.equal(user);

          // Test current user.
          Kinvey.getCurrentUser().should.equal(response);
          (response.isLoggedIn).should.be['true'];

          done();
        }
      }));
    });
  });

  // Kinvey.User#destroy
  describe('#destroy', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.init(callback(done));
    });

    // Test suite.
    it('destroys a user.', function(done) {
      this.user.destroy(callback(done));
    });
  });

  // Kinvey.User#load
  describe('#load', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.init(callback(done));
    });
    afterEach(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('loads a user.', function(done) {
      var user = this.user;
      new Kinvey.User().load(user.getId(), callback(done, {
        success: function(response) {
          (response.getId()).should.equal(user.getId());
          (response.getUsername()).should.equal(user.getUsername());
          done();
        }
      }));
    });
  });

  // Kinvey.User#login
  describe('#login', function() {
    // Create the current user, to allow logging in using its credentials.
    beforeEach(function(done) {
      this.user = Kinvey.User.init(callback(done));
    });
    afterEach(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('authenticates a user.', function(done) {
      var user = this.user;
      new Kinvey.User().login(user.getUsername(), user.getPassword(), callback(done, {
        success: function(response) {
          (response.getUsername()).should.equal(user.getUsername());
          (response.getPassword()).should.equal(user.getPassword());

          // Test current user.
          Kinvey.getCurrentUser().should.equal(response);
          (response.isLoggedIn).should.be['true'];

          done();
        }
      }));
    });
  });

  // Kinvey.User#logout
  describe('#logout', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.init(callback(done));
    });
    afterEach(function(done) {
      // User is logged out. To destroy, log back in first.
      this.user.login(this.user.getUsername(), this.user.getPassword(), callback(done, {
        success: function(user) {
          user.destroy(callback(done));
        }
      }));
    });

    // Test suite.
    it('logs out the current user.', function() {
      Kinvey.getCurrentUser().logout();

      // Test current user.
      (null === Kinvey.getCurrentUser()).should.be['true'];
      (this.user.isLoggedIn).should.be.False;
    });
  });

  // Kinvey.User#save
  describe('#save', function() {
    // Create the current user.
    beforeEach(function(done) {
      this.user = Kinvey.User.init(callback(done));
    });
    afterEach(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('Updates an existing user.', function(done) {
      var user = this.user;
      user.set('key', 'value');
      user.save(callback(done, {
        success: function(response) {
          response.should.equal(user);
          (response.get('key')).should.equal('value');
          done();
        }
      }));
    });
  });

});