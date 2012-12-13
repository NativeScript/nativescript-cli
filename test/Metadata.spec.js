/**
 * Kinvey.Metadata test suite.
 */
describe('Kinvey.Metadata', function() {
  beforeEach(function() {
    this.metadata = new Kinvey.Metadata();
  });

  // Kinvey.Metadata#constructor
  describe('.constructor', function() {
    it('accepts a predefined metadata.', function() {
      var metadata = { _acl: { creator: 'foo' } };
      new Kinvey.Metadata(metadata).toJSON()._acl.should.equal(metadata._acl);
    });
  });

  // Kinvey.Metadata#addReader
  describe('.addReader', function() {
    // Test suite.
    it('adds a reader.', function() {
      this.metadata.addReader('foo');
      this.metadata.getReaders().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
    it('adds two readers.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('bar');
      this.metadata.getReaders().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
    it('adds the same reader twice.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('foo');
      this.metadata.getReaders().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
  });

  // Kinvey.Metadata#addReaderGroup
  describe('.addReaderGroup', function() {
    // Test suite.
    it('adds a reader group.', function() {
      this.metadata.addReaderGroup('foo');
      this.metadata.getReaderGroups().should.eql(['foo']);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
    it('adds two reader groups.', function() {
      this.metadata.addReaderGroup('foo');
      this.metadata.addReaderGroup('bar');
      this.metadata.getReaderGroups().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
    it('adds the same group twice.', function() {
      this.metadata.addReaderGroup('foo');
      this.metadata.addReaderGroup('foo');
      this.metadata.getReaderGroups().should.eql(['foo']);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
  });

  // Kinvey.Metadata#addWriter
  describe('.addWriter', function() {
    // Test suite.
    it('adds a writer.', function() {
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
    it('adds two writers.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('bar');
      this.metadata.getWriters().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
    it('adds the same writer twice.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
  });

  // Kinvey.Metadata#addWriterGroup
  describe('.addWriterGroup', function() {
    // Test suite.
    it('adds a writer group.', function() {
      this.metadata.addWriterGroup('foo');
      this.metadata.getWriterGroups().should.eql(['foo']);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
    it('adds two writer groups.', function() {
      this.metadata.addWriterGroup('foo');
      this.metadata.addWriterGroup('bar');
      this.metadata.getWriterGroups().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
    it('adds the same group twice.', function() {
      this.metadata.addWriterGroup('foo');
      this.metadata.addWriterGroup('foo');
      this.metadata.getWriterGroups().should.eql(['foo']);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
  });

  // Kinvey.Metadata#hasWritePermissions
  describe('.hasWritePermissions', function() {
    before(function(done) {
      this.user = Kinvey.User.create({}, callback(done));
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
    it('returns true when the entity has no owner.', function() {
      this.metadata.hasWritePermissions().should.be['true'];
    });
  });

  // Kinvey.Metadata#isGloballyReadable
  describe('.isGloballyReadable', function() {
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
  describe('.isGloballyWritable', function() {
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
  describe('.isOwner', function() {
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
      this.metadata = new Kinvey.Metadata({ _acl: { creator: 'foo' } });
      this.metadata.isOwner().should.be['false'];
    });
  });

  // Kinvey.Metadata#lastModified
  describe('.lastModified', function() {
    it('returns the last modification date.', function() {
      var lmt = new Date().toISOString();
      this.acl = new Kinvey.Metadata({ _kmd: { lmt: lmt }});
      this.acl.lastModified().should.eql(lmt);
    });
  });

  // Kinvey.Metadata#removeReader
  describe('.removeReader', function() {
    beforeEach(function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('bar');
    });

    // Test suite.
    it('removes a reader.', function() {
      this.metadata.removeReader('foo');
      this.metadata.getReaders().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
    it('removes two readers.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('bar');
      this.metadata.getReaders().should.eql([]);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
    it('removes the same reader twice.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('foo');
      this.metadata.getReaders().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.have.property('r');
    });
  });

  // Kinvey.Metadata#removeReaderGroup
  describe('.removeReaderGroup', function() {
    beforeEach(function() {
      this.metadata.addReaderGroup('foo');
      this.metadata.addReaderGroup('bar');
    });

    // Test suite.
    it('removes a reader group.', function() {
      this.metadata.removeReaderGroup('foo');
      this.metadata.getReaderGroups().should.eql(['bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
    it('removes two reader groups.', function() {
      this.metadata.removeReaderGroup('foo');
      this.metadata.removeReaderGroup('bar');
      this.metadata.getReaderGroups().should.eql([]);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
    it('removes the same reader group twice.', function() {
      this.metadata.removeReaderGroup('foo');
      this.metadata.removeReaderGroup('foo');
      this.metadata.getReaderGroups().should.eql(['bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('r');
    });
  });

  // Kinvey.Metadata#removeWriter
  describe('.removeWriter', function() {
    beforeEach(function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('bar');
    });

    // Test suite.
    it('removes a writer.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.getWriters().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
    it('removes two writers.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('bar');
      this.metadata.getWriters().should.eql([]);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
    it('removes the same writer twice.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('foo');
      this.metadata.getWriters().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.have.property('w');
    });
  });

  // Kinvey.Metadata#removeWriterGroup
  describe('.removeWriterGroup', function() {
    beforeEach(function() {
      this.metadata.addWriterGroup('foo');
      this.metadata.addWriterGroup('bar');
    });

    // Test suite.
    it('removes a writer group.', function() {
      this.metadata.removeWriterGroup('foo');
      this.metadata.getWriterGroups().should.eql(['bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
    it('removes two writer groups.', function() {
      this.metadata.removeWriterGroup('foo');
      this.metadata.removeWriterGroup('bar');
      this.metadata.getWriterGroups().should.eql([]);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
    it('removes the same writer group twice.', function() {
      this.metadata.removeWriterGroup('foo');
      this.metadata.removeWriterGroup('foo');
      this.metadata.getWriterGroups().should.eql(['bar']);
      this.metadata.toJSON()._acl.groups.should.have.property('w');
    });
  });

  // Kinvey.Metadata#setGloballyReadable
  describe('.setGloballyReadable', function() {
    // Test suite.
    it('marks the item as globally readable.', function() {
      this.metadata.setGloballyReadable(true);
      this.metadata.toJSON()._acl.gr.should.be['true'];
    });
    it('marks the item as not globally readable.', function() {
      this.metadata.setGloballyReadable(false);
      this.metadata.toJSON()._acl.gr.should.be['false'];
    });
  });

  // Kinvey.Metadata#setGloballyWritable
  describe('.setGloballyWritable', function() {
    // Test suite.
    it('marks the item as globally writable.', function() {
      this.metadata.setGloballyWritable(true);
      this.metadata.toJSON()._acl.gw.should.be['true'];
    });
    it('marks the item as not globally writable.', function() {
      this.metadata.setGloballyWritable(false);
      this.metadata.toJSON()._acl.gw.should.be['false'];
    });
  });

  // Test actual working of the permissions.
  describe('Kinvey.Entity', function() {
    beforeEach(function(done) {
      this.entity = new Kinvey.Entity({ foo: 'bar' }, COLLECTION_UNDER_TEST);

      // Define two users.
      var ownerAttr = this.ownerAttr = { password: 'bar' };// Entity owner.
      this.userAttr = { password: 'qux' };// Secondary user.

      // Create both.
      var self = this;
      Kinvey.User.create(this.userAttr, callback(done, {
        success: function(user) {
          // Save user, since we need its id.
          self.user = user;

          // Create and login the entity owner.
          Kinvey.User.create(ownerAttr, callback(done, {
            success: function(user) {
              self.owner = user;
              done();
            }
          }));
        }
      }));
    });
    afterEach(function(done) {
      var entity = this.entity;
      var owner = this.owner;
      var ownerAttr = this.ownerAttr;

      // Destroy both users.
      Kinvey.getCurrentUser().destroy(callback(done, {
        success: function() {
          // Login the entity owner.
          new Kinvey.User().login(owner.getUsername(), ownerAttr.password, callback(done, {
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
      var username = this.user.getUsername();
      var password = this.userAttr.password;

      // Set permissions.
      this.entity.getMetadata().addReader(this.user.getId());
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and fetch the entity.
          new Kinvey.User().login(username, password, callback(done, {
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
      var username = this.user.getUsername();
      var password = this.userAttr.password;

      // Set permissions.
      this.entity.getMetadata().addWriter(this.user.getId());
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and write to entity.
          new Kinvey.User().login(username, password, callback(done, {
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
      var username = this.user.getUsername();
      var password = this.userAttr.password;

      // Set permissions.
      this.entity.getMetadata().setGloballyReadable(true);
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and fetch the entity.
          new Kinvey.User().login(username, password, callback(done, {
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
      var username = this.user.getUsername();
      var password = this.userAttr.password;

      // Set permissions.
      this.entity.getMetadata().setGloballyWritable(true);
      this.entity.save(callback(done, {
        success: function(entity) {
          // Login the test user, and write to entity.
          new Kinvey.User().login(username, password, callback(done, {
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