// Obtain a reference to the top-level describe method.
var globalDescribe = describe;

/**
 * Test suite for the metadata of `Kinvey.Backbone.Model`.
 */
describe('Kinvey.Backbone.Model metadata', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: mock a document.
  beforeEach(function() {
    this.model = new Kinvey.Backbone.Model({
      _kmd: {
        ect: new Date().toString(),
        lmt: new Date().toString()
      }
    });
  });
  afterEach(function() {// Cleanup.
    delete this.model;
  });

  // Kinvey.Backbone.Model.getAcl.
  describe('the getAcl method', function() {
    // Test suite.
    it('should return the ACL.', function() {
      var result = this.model.getAcl();
      expect(result).to.be.an.instanceOf(Kinvey.Acl);
    });
    it('should update the ACL if modified.', function() {
      var result = this.model.getAcl();
      result.addReader(this.randomID());
      expect(this.model.get('_acl')).to.equal(result.toJSON());
    });
    it('should not trigger a change event if modified.', function() {
      var spy = sinon.spy();
      this.model.on('change', spy);

      var result = this.model.getAcl();
      result.addReader(this.randomID());

      expect(spy).not.to.be.called;
    });
  });

  // Kinvey.Backbone.Model.getCreatedAt.
  describe('the getCreatedAt method', function() {
    // Test suite.
    it('should return a date.', function() {
      var result = this.model.getCreatedAt();
      expect(result).to.be.an.instanceOf(Date);
    });
    it('should return the correct date.', function() {
      var result = this.model.getCreatedAt();
      expect(result.toString()).to.equal(this.model.get('_kmd').ect);
    });
  });

  // Kinvey.Backbone.Model.getLastModified.
  describe('the getLastModified method', function() {
    // Test suite.
    it('should return a date.', function() {
      var result = this.model.getLastModified();
      expect(result).to.be.an.instanceOf(Date);
    });
    it('should return the correct date.', function() {
      var result = this.model.getLastModified();
      expect(result.toString()).to.equal(this.model.get('_kmd').lmt);
    });
  });

  // Kinvey.Backbone.Model.setAcl.
  describe('the setAcl method', function() {
    // Test suite.
    it('should return the model.', function() {
      var result = this.model.setAcl(new Kinvey.Acl());
      expect(result).to.equal(this.model);
    });
    it('should update the ACL.', function() {
      var acl = new Kinvey.Acl().addReader(this.randomID());
      var result = this.model.setAcl(acl);
      expect(result.get('_acl')).to.equal(acl.toJSON());
    });
    it('should not trigger a change event.', function() {
      var spy = sinon.spy();
      this.model.on('change', spy);

      this.model.setAcl(new Kinvey.Acl());

      expect(spy).not.to.be.called;
    });
  });

});