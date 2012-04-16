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
      this.user.destroy(done, done);
    });

    // Test suite.
    it('creates the current user.', function(done) {
      var user = this.user = Kinvey.User.create('foo', 'bar', function() {
        this.should.equal(user);
        (this.getUsername()).should.equal('foo');
        (this.getPassword()).should.equal('bar');

        // Test current user.
        Kinvey.getCurrentUser().should.equal(this);
        this.isLoggedIn.should.be.True;

        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
    it('creates the current user with auto-generated password.', function(done) {
      var user = this.user = Kinvey.User.create('foo', function() {
        this.should.equal(user);
        (this.getUsername()).should.equal('foo');
        (this.getPassword()).should.not.equal(null);

        // Test current user.
        Kinvey.getCurrentUser().should.equal(this);
        (this.isLoggedIn).should.be.True;

        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
    it('creates an anonymous current user.', function(done) {
      var user = this.user = Kinvey.User.create(function() {
        this.should.equal(user);
        (this.getUsername()).should.not.equal(null);
        (this.getPassword()).should.not.equal(null);

        // Test current user.
        Kinvey.getCurrentUser().should.equal(this);
        (this.isLoggedIn).should.be.True;

        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.User#destroy
  describe('#destroy', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.create(done, done);
    });

    // Test suite.
    it('destroys a user.', function(done) {
      var user = this.user;
      this.user.destroy(function() {
        this.should.equal(user);
        done();
      }, function(error) {
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.User#load
  describe('#load', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.create('foo', done, done);
    });
    afterEach(function(done) {
      this.user.destroy(done, done);
    });

    // Test suite.
    it('loads a user', function(done) {
      var username = this.user.getUsername();

      var user = new Kinvey.User();
      user.load(this.user.getId(), function() {
        this.should.equal(user);
        (this.getUsername()).should.equal(username);
        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.User#login
  describe('#login', function() {
    // Create the current user, to allow logging in using its credentials.
    beforeEach(function(done) {
      this.user = Kinvey.User.create(done, done);
    });
    afterEach(function(done) {
      this.user.destroy(done, done);
    });

    // Test suite.
    it('authenticates a user', function(done) {
      var username = this.user.getUsername();
      var password = this.user.getPassword();

      var user = this.user = new Kinvey.User();
      user.login(username, password, function() {
        this.should.equal(user);
        (this.getUsername()).should.equal(username);
        (this.getPassword()).should.equal(password);

        // Test current user.
        Kinvey.getCurrentUser().should.equal(this);
        (this.isLoggedIn).should.be.True;

        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
  });

  // Kinvey.User#logout
  describe('#logout', function() {
    // Create mock.
    beforeEach(function(done) {
      this.user = Kinvey.User.create('foo', 'bar', done, done);
    });
    afterEach(function(done) {
      // User is logged out. To destroy, log back in first.
      this.user.login('foo', 'bar', function() {
        this.destroy(done, done);
      }, done);
    });

    // Test suite.
    it('logs out the current user.', function() {
      this.user.logout();

      // Test current user.
      (null === Kinvey.getCurrentUser()).should.be.True;
      (this.user.isLoggedIn).should.be.False;
    });
  });

  // Kinvey.User#save
  describe('#save', function() {
    // Create the current user.
    beforeEach(function(done) {
      this.user = Kinvey.User.create('foo', done, done);
    });
    afterEach(function(done) {
      this.user.destroy(done, done);
    });

    // Test suite.
    it('Updates an existing user', function(done) {
      var user = this.user;
      user.set('key', 'value');
      user.save(function() {
        this.should.equal(user);
        (this.get('key')).should.equal('value');
        done();
      }, function(error) {
        this.should.equal(user);
        done(new Error(error.error));
      });
    });
  });

});