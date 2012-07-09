/**
 * Kinvey.Metadata test suite.
 */
describe('Kinvey.Metadata', function() {
  beforeEach(function() {
    this.metadata = new Kinvey.Metadata();
  });

  // Kinvey.Metadata#constructor
  describe('#constructor', function() {
    it('accepts a predefined metadata.', function() {
      var metadata = { _acl: { creator: 'foo' } };
      new Kinvey.Metadata(metadata).toJSON()._acl.should.eql(metadata._acl);
    });
  });

  // Kinvey.Metadata#addReader
  describe('#addReader', function() {
    // Test suite.
    it('adds a reader.', function() {
      this.metadata.addReader('foo');
      this.metadata.getReaders().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ r: ['foo'] });
    });
    it('adds two readers.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('bar');
      this.metadata.getReaders().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.eql({ r: ['foo', 'bar'] });
    });
    it('adds the same reader twice.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('foo');
      this.metadata.getReaders().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ r: ['foo'] });
    });
  });

  // Kinvey.Metadata#addWriter
  describe('#addWriter', function() {
    // Test suite.
    it('adds a writer.', function() {
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ w: ['foo'] });
    });
    it('adds two writers.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('bar');
      this.metadata.getWriters().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.eql({ w: ['foo', 'bar'] });
    });
    it('adds the same writer twice.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ w: ['foo'] });
    });
  });

  // Kinvey.Metadata#hasWritePermissions
  describe('#hasWritePermissions', function() {
    before(function(done) {
      this.user = Kinvey.User.create({}, callback(done, {}));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('returns true when the current user is the owner.', function() {
      this.metadata = new Kinvey.Metadata({ _acl: { creator: this.user.getId() } });
      this.metadata.isOwner().should.be['true'];
      this.metadata.hasWritePermissions().should.be['true'];
    });
    it('returns true when the current user is a writer.', function() {
      this.metadata.addWriter(this.user.getId());
      this.metadata.hasWritePermissions().should.be['true'];
    });
    it('returns true when the entity is globally writable.', function() {
      this.metadata.setGloballyWritable(true);
      this.metadata.hasWritePermissions().should.be['true'];
    });
    it('returns false when the current user has no write permissions.', function() {
      this.metadata.hasWritePermissions().should.be['false'];
    });
  });

  // Kinvey.Metadata#isGloballyReadable
  describe('#isGloballyReadable', function() {
    // Test suite.
    it('returns true when the entity is globally readable.', function() {
      this.metadata.setGloballyReadable(true);
      this.metadata.isGloballyReadable().should.be['true'];
    });
    it('returns false when the entity is not globally readable.', function() {
      this.metadata.setGloballyReadable(false);
      this.metadata.isGloballyReadable().should.be['false'];
    });
  });

  // Kinvey.Metadata#isGloballyWritable
  describe('#isGloballyWritable', function() {
    // Test suite.
    it('returns true when the entity is globally writable.', function() {
      this.metadata.setGloballyWritable(true);
      this.metadata.isGloballyWritable().should.be['true'];
    });
    it('returns false when the entity is not globally writable.', function() {
      this.metadata.setGloballyWritable(false);
      this.metadata.isGloballyWritable().should.be['false'];
    });
  });

  // Kinvey.Metadata#isOwner
  describe('#isOwner', function() {
    before(function(done) {
      this.user = Kinvey.User.create({}, callback(done, {}));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('returns true when the current user is the owner.', function() {
      this.metadata = new Kinvey.Metadata({ _acl: { creator: this.user.getId() } });
      this.metadata.isOwner().should.be['true'];
    });
    it('returns false when the current user is not the owner.', function() {
      this.metadata = new Kinvey.Metadata({ creator: 'foo' });
      this.metadata.isOwner().should.be['false'];
    });
  });

  // Kinvey.Metadata#lastModified
  describe('#lastModified', function() {
    it('returns the last modification date.', function() {
      var lmt = new Date().toISOString();
      this.acl = new Kinvey.Metadata({ _kmd: { lmt: lmt }});
      this.acl.lastModified().should.eql(lmt);
    });
  });

  // Kinvey.Metadata#removeReader
  describe('#removeReader', function() {
    beforeEach(function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('bar');
    });

    // Test suite.
    it('removes a reader.', function() {
      this.metadata.removeReader('foo');
      this.metadata.getReaders().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ r: ['bar'] });
    });
    it('removes two readers.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('bar');
      this.metadata.getReaders().should.eql([]);
      this.metadata.toJSON()._acl.should.eql({ r: [] });
    });
    it('removes the same reader twice.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('foo');
      this.metadata.getReaders().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ r: ['bar'] });
    });
  });

  // Kinvey.Metadata#removeWriter
  describe('#removeWriter', function() {
    beforeEach(function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('bar');
    });

    // Test suite.
    it('removes a writer.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.getWriters().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ w: ['bar'] });
    });
    it('removes two writers.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('bar');
      this.metadata.getWriters().should.eql([]);
      this.metadata.toJSON()._acl.should.eql({ w: [] });
    });
    it('removes the same writer twice.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('foo');
      this.metadata.getWriters().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ w: ['bar'] });
    });
  });

  // Kinvey.Metadata#setGloballyReadable
  describe('#setGloballyReadable', function() {
    // Test suite.
    it('marks the item as globally readable.', function() {
      this.metadata.setGloballyReadable(true);
      this.metadata.toJSON()._acl.should.eql({ gr: true });
    });
    it('marks the item as not globally readable.', function() {
      this.metadata.setGloballyReadable(false);
      this.metadata.toJSON()._acl.should.eql({ gr: false });
    });
  });

  // Kinvey.Metadata#setGloballyWritable
  describe('#setGloballyWritable', function() {
    // Test suite.
    it('marks the item as globally writable.', function() {
      this.metadata.setGloballyWritable(true);
      this.metadata.toJSON()._acl.should.eql({ gw: true });
    });
    it('marks the item as not globally writable.', function() {
      this.metadata.setGloballyWritable(false);
      this.metadata.toJSON()._acl.should.eql({ gw: false });
    });
  });

  // Test actual working of the permissions.
  describe('Kinvey.Entity', function() {
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST);

      // Define two users.
      var ownerAttr = this.ownerAttr = { username: 'foo', password: 'bar' };// Entity owner.
      this.userAttr = { username: 'baz', password: 'qux' };// Secondary user.

      // Create both.
      var self = this;
      Kinvey.User.create(this.userAttr, callback(done, {
        success: function(user) {
          // Save user, since we need its id.
          self.user = user;

          // Create and login the entity owner.
          Kinvey.User.create(ownerAttr, callback(done));
        }
      }));
    });
    afterEach(function(done) {
      var entity = this.entity;
      var owner = this.ownerAttr;

      // Destroy both users.
      Kinvey.getCurrentUser().destroy(callback(done, {
        success: function() {
          // Login the entity owner.
          new Kinvey.User().login(owner.username, owner.password, callback(done, {
            // Destroy user and entity.
            success: function(user) {
              entity.destroy(callback(done, {
                success: function() {
                  user.destroy(callback(done));
                }
              }));
            }
          }));
        }
      }));
    });

    // Test suite.
    it('is readable by a specific user.', function(done) {
      var userAttr = this.userAttr;

      // Set permissions.
      this.entity.getMetadata().addReader(this.user.getId());
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and fetch the entity.
          new Kinvey.User().login(userAttr.username, userAttr.password, callback(done, {
            success: function() {
              entity.load(entity.getId(), callback(done, {
                success: function(entity) {
                  entity.get('foo').should.equal('bar');
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('is writable by a specific user.', function(done) {
      var userAttr = this.userAttr;

      // Set permissions.
      this.entity.getMetadata().addWriter(this.user.getId());
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and write to entity.
          new Kinvey.User().login(userAttr.username, userAttr.password, callback(done, {
            success: function() {
              entity.set('foo', 'baz');
              entity.save(callback(done, {
                success: function(response) {
                  response.get('foo').should.equal('baz');
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('is globally readable.', function(done) {
      var userAttr = this.userAttr;

      // Set permissions.
      this.entity.getMetadata().setGloballyReadable(true);
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and fetch the entity.
          new Kinvey.User().login(userAttr.username, userAttr.password, callback(done, {
            success: function() {
              entity.load(entity.getId(), callback(done, {
                success: function(entity) {
                  entity.get('foo').should.equal('bar');
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('is globally writable.', function(done) {
      var userAttr = this.userAttr;

      // Set permissions.
      this.entity.getMetadata().setGloballyWritable(true);
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and write to entity.
          new Kinvey.User().login(userAttr.username, userAttr.password, callback(done, {
            success: function() {
              entity.set('foo', 'baz');
              entity.save(callback(done, {
                success: function(response) {
                  response.get('foo').should.equal('baz');
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
  });

});