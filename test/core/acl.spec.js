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
 * Test suite for `Kinvey.Acl`.
 */
describe('Kinvey.Acl', function() {

  // Housekeeping: create an empty ACL.
  beforeEach(function() {
    this.acl = new Kinvey.Acl();

    // Define shortcut method to access the ACL data.
    var _this = this;
    this.json = function() {
      return _this.acl.toJSON();
    };
  });
  afterEach(function() {// Cleanup.
    delete this.acl;
    delete this.json;
  });

  // Kinvey.Acl.
  describe('the constructor', function() {
    // Test suite.
    it('should throw on invalid arguments: document.', function() {
      var _this = this;
      expect(function() {
        _this.acl = new Kinvey.Acl(_this.randomID());
      }).to.Throw('Object');
    });
    it('should operate on an existing document’s ACL.', function() {
      var document = { foo: this.randomID() };
      var acl = new Kinvey.Acl(document);
      acl.setGloballyReadable(true);
      expect(document).to.have.deep.property('_acl.gr', true);
    });
    it('should create a new ACL object.', function() {
      var acl = new Kinvey.Acl();
      acl.setGloballyReadable(true);
      expect(acl.toJSON()).to.have.property('gr', true);
    });
  });

  // Kinvey.Acl#addReader.
  describe('the addReader method', function() {
    // Test suite.
    it('should add a reader.', function() {
      this.acl.addReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).deep.equal([ this.user._id ]);
    });
    it('should add multiple readers.', function() {
      this.acl.addReader(this.randomID()).addReader(this.randomID());
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(2);
    });
    it('should not add the same reader twice.', function() {
      this.acl.addReader(this.user._id).addReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).deep.equal([ this.user._id ]);
    });
    it('should return the ACL.', function() {
      var result = this.acl.addReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#addReaderGroup.
  describe('the addReaderGroup method', function() {
    // Housekeeping: define a user group.
    before(function() {
      this.group = this.randomID();
    });
    after(function() {// Cleanup.
      delete this.group;
    });

    // Test suite.
    it('should add a reader group.', function() {
      this.acl.addReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).deep.equal([ this.group ]);
    });
    it('should add multiple reader groups.', function() {
      this.acl.addReaderGroup(this.randomID()).addReaderGroup(this.randomID());
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(2);
    });
    it('should not add the same reader group twice.', function() {
      this.acl.addReaderGroup(this.group).addReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).deep.equal([ this.group ]);
    });
    it('should return the ACL.', function() {
      var result = this.acl.addReaderGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });


  // Kinvey.Acl#addWriterGroup.
  describe('the addWriterGroup method', function() {
    // Housekeeping: define a user group.
    before(function() {
      this.group = this.randomID();
    });
    after(function() {// Cleanup.
      delete this.group;
    });

    // Test suite.
    it('should add a writer group.', function() {
      this.acl.addWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).deep.equal([ this.group ]);
    });
    it('should add multiple writer groups.', function() {
      this.acl.addWriterGroup(this.randomID()).addWriterGroup(this.randomID());
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(2);
    });
    it('should not add the same writer group twice.', function() {
      this.acl.addWriterGroup(this.group).addWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).deep.equal([ this.group ]);
    });
    it('should return the ACL.', function() {
      var result = this.acl.addWriterGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#addWriter.
  describe('the addWriter method', function() {
    // Test suite.
    it('should add a writer.', function() {
      this.acl.addWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).deep.equal([ this.user._id ]);
    });
    it('should add multiple writers.', function() {
      this.acl.addWriter(this.randomID()).addWriter(this.randomID());
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(2);
    });
    it('should not add the same writer twice.', function() {
      this.acl.addWriter(this.user._id).addWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).deep.equal([ this.user._id ]);
    });
    it('should return the ACL.', function() {
      var result = this.acl.addWriter(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#getCreator.
  describe('the getCreator method', function() {
    // Test suite.
    it('should return the creator.', function() {
      var acl = new Kinvey.Acl({ _acl: { creator: this.user._id } });
      var creator = acl.getCreator();
      expect(creator).to.equal(this.user._id);
    });
    it('should return `null` if not set.', function() {
      var creator = this.acl.getCreator();
      expect(creator).to.be['null'];
    });
  });

  // Kinvey.Acl#getReaders.
  describe('the getReaders method', function() {
    // Housekeeping: add readers.
    beforeEach(function() {
      this.acl.addReader(this.randomID()).addReader(this.randomID());
    });

    // Test suite.
    it('should return an empty list if there are no readers.', function() {
      var acl = new Kinvey.Acl();
      expect(acl.getReaders()).to.be.empty;
    });
    it('should return a list of readers.', function() {
      expect(this.acl.getReaders()).to.be.an('array');
      expect(this.acl.getReaders()).to.have.length(2);
    });
  });

  // Kinvey.Acl#getReaderGroups.
  describe('the getReaderGroups method', function() {
    // Housekeeping: add reader groups.
    beforeEach(function() {
      this.acl.addReaderGroup(this.randomID()).addReaderGroup(this.randomID());
    });

    // Test suite.
    it('should return an empty list if there are no reader groups.', function() {
      var acl = new Kinvey.Acl();
      expect(acl.getReaderGroups()).to.be.empty;
    });
    it('should return a list of reader groups.', function() {
      expect(this.acl.getReaderGroups()).to.be.an('array');
      expect(this.acl.getReaderGroups()).to.have.length(2);
    });
  });

  // Kinvey.Acl#getWriterGroups.
  describe('the getWriterGroups method', function() {
    // Housekeeping: add writer groups.
    beforeEach(function() {
      this.acl.addWriterGroup(this.randomID()).addWriterGroup(this.randomID());
    });

    // Test suite.
    it('should return an empty list if there are no writer groups.', function() {
      var acl = new Kinvey.Acl();
      expect(acl.getWriterGroups()).to.be.empty;
    });
    it('should return a list of writer groups.', function() {
      expect(this.acl.getWriterGroups()).to.be.an('array');
      expect(this.acl.getWriterGroups()).to.have.length(2);
    });
  });

  // Kinvey.Acl#getWriters.
  describe('the getWriters method', function() {
    // Housekeeping: add writers.
    beforeEach(function() {
      this.acl.addWriter(this.randomID()).addWriter(this.randomID());
    });

    // Test suite.
    it('should return an empty list if there are no writers.', function() {
      var acl = new Kinvey.Acl();
      expect(acl.getWriters()).to.be.empty;
    });
    it('should return a list of writers.', function() {
      expect(this.acl.getWriters()).to.be.an('array');
      expect(this.acl.getWriters()).to.have.length(2);
    });
  });

  // Kinvey.Acl#isGloballyReadable.
  describe('the isGloballyReadable method', function() {
    // Test suite.
    it('should return `true` if the entity is globally readable.', function() {
      this.acl.setGloballyReadable(true);
      expect(this.acl.isGloballyReadable()).to.be['true'];
    });
    it('should return `false` if the entity is not globally readable.', function() {
      this.acl.setGloballyReadable(false);
      expect(this.acl.isGloballyReadable()).to.be['false'];
    });
  });

  // Kinvey.Acl#isGloballyWritable.
  describe('the isGloballyWritable method', function() {
    // Test suite.
    it('should return `true` if the entity is globally writable.', function() {
      this.acl.setGloballyWritable(true);
      expect(this.acl.isGloballyWritable()).to.be['true'];
    });
    it('should return `false` if the entity is not globally writable.', function() {
      this.acl.setGloballyWritable(false);
      expect(this.acl.isGloballyWritable()).to.be['false'];
    });
  });

  // Kinvey.Acl#removeReader.
  describe('the removeReader method', function() {
    // Housekeeping: add readers.
    beforeEach(function() {
      this.acl.addReader(this.randomID());
      this.acl.addReader(this.user._id);
      this.acl.addReader(this.randomID());
    });

    // Test suite.
    it('should remove a reader.', function() {
      this.acl.removeReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(2);
      expect(this.json().r).not.to.contain(this.user._id);
    });
    it('should silently succeed if the user is not a reader.', function() {
      this.acl.removeReader(this.randomID());
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(3);
    });
    it('should return the ACL.', function() {
      var result = this.acl.removeReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#removeReaderGroup.
  describe('the removeReaderGroup method', function() {
    // Housekeeping: define a user group.
    before(function() {
      this.group = this.randomID();
    });
    after(function() {// Cleanup.
      delete this.group;
    });

    // Housekeeping: add reader groups.
    beforeEach(function() {
      this.acl.addReaderGroup(this.randomID());
      this.acl.addReaderGroup(this.group);
      this.acl.addReaderGroup(this.randomID());
    });

    // Test suite.
    it('should remove a reader group.', function() {
      this.acl.removeReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(2);
      expect(this.json().groups.r).not.to.contain(this.group);
    });
    it('should silently succeed if the user group is not a reader.', function() {
      this.acl.removeReaderGroup(this.randomID());
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(3);
    });
    it('should return the ACL.', function() {
      var result = this.acl.removeReaderGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#removeWriterGroup.
  describe('the removeWriterGroup method', function() {
    // Housekeeping: define a user group.
    before(function() {
      this.group = this.randomID();
    });
    after(function() {// Cleanup.
      delete this.group;
    });

    // Housekeeping: add writer groups.
    beforeEach(function() {
      this.acl.addWriterGroup(this.randomID());
      this.acl.addWriterGroup(this.group);
      this.acl.addWriterGroup(this.randomID());
    });

    // Test suite.
    it('should remove a writer group.', function() {
      this.acl.removeWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(2);
      expect(this.json().groups.w).not.to.contain(this.group);
    });
    it('should silently succeed if the user group is not a writer.', function() {
      this.acl.removeWriterGroup(this.randomID());
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(3);
    });
    it('should return the ACL.', function() {
      var result = this.acl.removeWriterGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#removeWriter.
  describe('the removeWriter method', function() {
    // Housekeeping: add writers.
    beforeEach(function() {
      this.acl.addWriter(this.randomID());
      this.acl.addWriter(this.user._id);
      this.acl.addWriter(this.randomID());
    });

    // Test suite.
    it('should remove a writer.', function() {
      this.acl.removeWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(2);
      expect(this.json().w).not.to.contain(this.user._id);
    });
    it('should silently succeed if the user is not a writer.', function() {
      this.acl.removeWriter(this.randomID());
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(3);
    });
    it('should return the ACL.', function() {
      var result = this.acl.removeReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#setGloballyReadable.
  describe('the setGloballyReadable method', function() {
    // Test suite.
    it('should specify the entity as globally readable.', function() {
      this.acl.setGloballyReadable(true);
      expect(this.json()).to.have.property('gr', true);
    });
    it('should specify the entity as not globally readable.', function() {
      this.acl.setGloballyReadable(false);
      expect(this.json()).to.have.property('gr', false);
    });
    it('should return the ACL.', function() {
      var result = this.acl.setGloballyReadable();
      expect(result).to.equal(this.acl);
    });
  });

  // Kinvey.Acl#setGloballyWritable.
  describe('the setGloballyWritable method', function() {
    // Test suite.
    it('should specify the entity as globally writable.', function() {
      this.acl.setGloballyWritable(true);
      expect(this.json()).to.have.property('gw', true);
    });
    it('should specify the entity as not globally writable.', function() {
      this.acl.setGloballyWritable(false);
      expect(this.json()).to.have.property('gw', false);
    });
    it('should return the ACL.', function() {
      var result = this.acl.setGloballyWritable();
      expect(result).to.equal(this.acl);
    });
  });

});