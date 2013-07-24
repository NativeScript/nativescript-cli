/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Test suite for `Kinvey.Metadata`.
 */
describe('Kinvey.Metadata', function() {

  // Housekeeping: set the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });

  // Housekeeping: create a document.
  before(function() {
    var _this = this;
    return Kinvey.DataStore.save(this.collection, {}).then(function(doc) {
      _this.doc = doc;
    });
  });
  after(function() {// Delete the document.
    return Kinvey.DataStore.destroy(this.collection, this.doc._id);
  });
  after(function() {// Cleanup.
    delete this.doc;
  });

  // Housekeeping: create the metadata.
  beforeEach(function() {
    this.metadata = new Kinvey.Metadata(this.doc);
  });
  afterEach(function() {// Cleanup.
    delete this.metadata;
  });

  // Housekeeping: reset the active user.
  after(function() {
    Kinvey.setActiveUser(null);
  });

  // Kinvey.Metadata.
  describe('the constructor', function() {
    // Test suite.
    it('should throw on invalid arguments: document.', function() {
      var _this = this;
      expect(function() {
        _this.metadata = new Kinvey.Metadata(_this.randomID());
      }).to.Throw('Object');
    });
  });

  // Kinvey.Metadata#getAcl.
  describe('the getAcl method', function() {
    // Test suite.
    it('should return its `Kinvey.Acl` instance.', function() {
      var acl = this.metadata.getAcl();
      expect(acl).to.be.an.instanceOf(Kinvey.Acl);
      expect(acl.getCreator()).to.equal(this.user._id);
    });
  });

  // Kinvey.Metadata#getCreatedAt.
  describe('the getCreatedAt method', function() {
    // Test suite.
    it('should return `null` if not set.', function() {
      var metadata = new Kinvey.Metadata({});
      expect(metadata.getCreatedAt()).to.be['null'];
    });
    it('should return a `Date`.', function() {
      var date = this.metadata.getCreatedAt();
      expect(date).to.be.an.instanceOf(Date);
    });
    it('should return the correct date.', function() {
      var date = this.metadata.getCreatedAt();
      expect(date.toISOString()).to.equal(this.doc._kmd.ect);
    });
  });

  // Kinvey.Metadata#getEmailVerification.
  describe('the getEmailVerification method.', function() {
    // Test suite.
    it('should return `null` if not set.', function() {
      var metadata = new Kinvey.Metadata({});
      expect(metadata.getEmailVerification()).to.be['null'];
    });
    it('should return the email verification status.', function() {
      var attr = { _kmd: { emailVerification: { status: 'sent' } } };
      var metadata = new Kinvey.Metadata(attr);
      var status = metadata.getEmailVerification();
      expect(status).to.equal(attr._kmd.emailVerification.status);
    });
  });

  // Kinvey.Metadata#getLastModified.
  describe('the getLastModified method', function() {
    // Test suite.
    it('should return `null` if not set.', function() {
      var metadata = new Kinvey.Metadata({});
      expect(metadata.getLastModified()).to.be['null'];
    });
    it('should return a `Date`.', function() {
      var date = this.metadata.getLastModified();
      expect(date).to.be.an.instanceOf(Date);
    });
    it('should return the correct date.', function() {
      var date = this.metadata.getLastModified();
      expect(date.toISOString()).to.equal(this.doc._kmd.lmt);
    });
  });

  // Kinvey.Metadata#setAcl.
  describe('the setAcl method', function() {
    // Test suite.
    it('should throw on invalid arguments: acl.', function() {
      var _this = this;
      expect(function() {
        _this.metadata.setAcl({});
      }).to.Throw('Kinvey.Acl');
    });
    it('should set the ACL.', function() {
      var acl = new Kinvey.Acl();
      acl.setGloballyReadable(true);
      this.metadata.setAcl(acl);
      expect(this.metadata.toJSON()).to.have.deep.property('_acl.gr', true);
    });
    it('should return the metadata.', function() {
      var result = this.metadata.setAcl(new Kinvey.Acl());
      expect(result).to.equal(this.metadata);
    });
  });

});