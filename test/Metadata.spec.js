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
      this.metadata.toJSON()._acl.should.eql({ readers: ['foo'] });
    });
    it('adds two readers.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('bar');
      this.metadata.getReaders().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.eql({ readers: ['foo', 'bar'] });
    });
    it('adds the same reader twice.', function() {
      this.metadata.addReader('foo');
      this.metadata.addReader('foo');
      this.metadata.getReaders().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ readers: ['foo'] });
    });
  });

  // Kinvey.Metadata#addWriter
  describe('#addWriter', function() {
    // Test suite.
    it('adds a writer.', function() {
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ writers: ['foo'] });
    });
    it('adds two writers.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('bar');
      this.metadata.getWriters().should.eql(['foo', 'bar']);
      this.metadata.toJSON()._acl.should.eql({ writers: ['foo', 'bar'] });
    });
    it('adds the same writer twice.', function() {
      this.metadata.addWriter('foo');
      this.metadata.addWriter('foo');
      this.metadata.getWriters().should.eql(['foo']);
      this.metadata.toJSON()._acl.should.eql({ writers: ['foo'] });
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
      this.metadata.toJSON()._acl.should.eql({ readers: ['bar'] });
    });
    it('removes two readers.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('bar');
      this.metadata.getReaders().should.eql([]);
      this.metadata.toJSON()._acl.should.eql({ readers: [] });
    });
    it('removes the same reader twice.', function() {
      this.metadata.removeReader('foo');
      this.metadata.removeReader('foo');
      this.metadata.getReaders().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ readers: ['bar'] });
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
      this.metadata.toJSON()._acl.should.eql({ writers: ['bar'] });
    });
    it('removes two writers.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('bar');
      this.metadata.getWriters().should.eql([]);
      this.metadata.toJSON()._acl.should.eql({ writers: [] });
    });
    it('removes the same writer twice.', function() {
      this.metadata.removeWriter('foo');
      this.metadata.removeWriter('foo');
      this.metadata.getWriters().should.eql(['bar']);
      this.metadata.toJSON()._acl.should.eql({ writers: ['bar'] });
    });
  });

  // Kinvey.Metadata#setGloballyReadable
  describe('#setGloballyReadable', function() {
    // Test suite.
    it('marks the item as globally readable.', function() {
      this.metadata.setGloballyReadable(true);
      this.metadata.toJSON()._acl.should.eql({ globalRead: true });
    });
    it('marks the item as not globally readable.', function() {
      this.metadata.setGloballyReadable(false);
      this.metadata.toJSON()._acl.should.eql({ globalRead: false });
    });
  });

  // Kinvey.Metadata#setGloballyWritable
  describe('#setGloballyWritable', function() {
    // Test suite.
    it('marks the item as globally writable.', function() {
      this.metadata.setGloballyWritable(true);
      this.metadata.toJSON()._acl.should.eql({ globalWrite: true });
    });
    it('marks the item as not globally writable.', function() {
      this.metadata.setGloballyWritable(false);
      this.metadata.toJSON()._acl.should.eql({ globalWrite: false });
    });
  });

});