/**
 * Copyright 2015 Kinvey, Inc.
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

const Acl = require('../../src/legacy/acl');

describe('Acl', function() {
  before(function() {
    return Common.loginUser().then(user => {
      this.user = user;
    });
  });

  after(function() {// Reset.
    return Common.logoutUser();
  });

  after(function() {
    delete this.user;
  });

  beforeEach(function() {
    this.acl = new Acl();

    this.json = () => {
      return this.acl.toJSON();
    };
  });

  afterEach(function() {
    delete this.acl;
    delete this.json;
  });

  describe('constructor()', function() {
    it('should throw on invalid arguments: document', function() {
      expect(function() {
        this.acl = new Acl(Common.randomString());
      }).to.throw('Object');
    });

    it('should operate on an existing document’s ACL', function() {
      const document = { foo: Common.randomString() };
      const acl = new Acl(document);
      acl.setGloballyReadable(true);
      expect(document).to.have.deep.property('_acl.gr', true);
    });

    it('should create a new ACL object', function() {
      const acl = new Acl();
      acl.setGloballyReadable(true);
      expect(acl.toJSON()).to.have.property('gr', true);
    });
  });

  describe('addReader()', function() {
    it('should add a reader', function() {
      this.acl.addReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).deep.equal([this.user._id]);
    });

    it('should add multiple readers', function() {
      this.acl.addReader(Common.randomString()).addReader(Common.randomString());
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(2);
    });

    it('should not add the same reader twice', function() {
      this.acl.addReader(this.user._id).addReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).deep.equal([this.user._id]);
    });

    it('should return the ACL', function() {
      const result = this.acl.addReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  describe('addReaderGroup()', function() {
    before(function() {
      this.group = Common.randomString();
    });

    after(function() {
      delete this.group;
    });

    it('should add a reader group', function() {
      this.acl.addReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).deep.equal([this.group]);
    });

    it('should add multiple reader groups', function() {
      this.acl.addReaderGroup(Common.randomString()).addReaderGroup(Common.randomString());
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(2);
    });

    it('should not add the same reader group twice', function() {
      this.acl.addReaderGroup(this.group).addReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).deep.equal([this.group]);
    });

    it('should return the ACL', function() {
      const result = this.acl.addReaderGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  describe('addWriterGroup()', function() {
    before(function() {
      this.group = Common.randomString();
    });

    after(function() {
      delete this.group;
    });

    it('should add a writer group', function() {
      this.acl.addWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).deep.equal([this.group]);
    });

    it('should add multiple writer groups', function() {
      this.acl.addWriterGroup(Common.randomString()).addWriterGroup(Common.randomString());
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(2);
    });

    it('should not add the same writer group twice', function() {
      this.acl.addWriterGroup(this.group).addWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).deep.equal([this.group]);
    });

    it('should return the ACL', function() {
      const result = this.acl.addWriterGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  describe('addWriter()', function() {
    it('should add a writer', function() {
      this.acl.addWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).deep.equal([this.user._id]);
    });

    it('should add multiple writers', function() {
      this.acl.addWriter(Common.randomString()).addWriter(Common.randomString());
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(2);
    });

    it('should not add the same writer twice', function() {
      this.acl.addWriter(this.user._id).addWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).deep.equal([this.user._id]);
    });

    it('should return the ACL', function() {
      const result = this.acl.addWriter(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  describe('getCreator()', function() {
    it('should return the creator', function() {
      const acl = new Acl({
        _acl: {
          creator: this.user._id
        }
      });
      const creator = acl.getCreator();
      expect(creator).to.equal(this.user._id);
    });

    it('should return `undefined` if not set', function() {
      const creator = this.acl.getCreator();
      expect(creator).to.be.undefined;
    });
  });

  describe('getReaders()', function() {
    beforeEach(function() {
      this.acl.addReader(Common.randomString()).addReader(Common.randomString());
    });

    it('should return an empty list if there are no readers', function() {
      const acl = new Acl();
      expect(acl.getReaders()).to.be.empty;
    });

    it('should return a list of readers', function() {
      expect(this.acl.getReaders()).to.be.an('array');
      expect(this.acl.getReaders()).to.have.length(2);
    });
  });

  describe('getReadersGroup()', function() {
    beforeEach(function() {
      this.acl.addReaderGroup(Common.randomString()).addReaderGroup(Common.randomString());
    });

    it('should return an empty list if there are no reader groups', function() {
      const acl = new Acl();
      expect(acl.getReaderGroups()).to.be.empty;
    });

    it('should return a list of reader groups', function() {
      expect(this.acl.getReaderGroups()).to.be.an('array');
      expect(this.acl.getReaderGroups()).to.have.length(2);
    });
  });

  describe('getWriters()', function() {
    beforeEach(function() {
      this.acl.addWriter(Common.randomString()).addWriter(Common.randomString());
    });

    it('should return an empty list if there are no writers', function() {
      const acl = new Acl();
      expect(acl.getWriters()).to.be.empty;
    });

    it('should return a list of writers', function() {
      expect(this.acl.getWriters()).to.be.an('array');
      expect(this.acl.getWriters()).to.have.length(2);
    });
  });

  describe('getWritersGroup()', function() {
    beforeEach(function() {
      this.acl.addWriterGroup(Common.randomString()).addWriterGroup(Common.randomString());
    });

    it('should return an empty list if there are no writer groups', function() {
      const acl = new Acl();
      expect(acl.getWriterGroups()).to.be.empty;
    });

    it('should return a list of writer groups', function() {
      expect(this.acl.getWriterGroups()).to.be.an('array');
      expect(this.acl.getWriterGroups()).to.have.length(2);
    });
  });

  describe('isGloballyReadable()', function() {
    it('should return `true` if the entity is globally readable', function() {
      this.acl.setGloballyReadable(true);
      expect(this.acl.isGloballyReadable()).to.be.true;
    });

    it('should return `false` if the entity is not globally readable', function() {
      this.acl.setGloballyReadable(false);
      expect(this.acl.isGloballyReadable()).to.be.false;
    });
  });

  describe('isGloballyWritable()', function() {
    it('should return `true` if the entity is globally writable', function() {
      this.acl.setGloballyWritable(true);
      expect(this.acl.isGloballyWritable()).to.be.true;
    });

    it('should return `false` if the entity is not globally writable', function() {
      this.acl.setGloballyWritable(false);
      expect(this.acl.isGloballyWritable()).to.be.false;
    });
  });

  describe('removeReader()', function() {
    beforeEach(function() {
      this.acl.addReader(Common.randomString());
      this.acl.addReader(this.user._id);
      this.acl.addReader(Common.randomString());
    });

    it('should remove a reader', function() {
      this.acl.removeReader(this.user._id);
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(2);
      expect(this.json().r).not.to.contain(this.user._id);
    });

    it('should silently succeed if the user is not a reader', function() {
      this.acl.removeReader(Common.randomString());
      expect(this.json()).to.have.property('r');
      expect(this.json().r).to.have.length(3);
    });

    it('should return the ACL', function() {
      const result = this.acl.removeReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  describe('removeReaderGroup()', function() {
    before(function() {
      this.group = Common.randomString();
    });

    after(function() {
      delete this.group;
    });

    beforeEach(function() {
      this.acl.addReaderGroup(Common.randomString());
      this.acl.addReaderGroup(this.group);
      this.acl.addReaderGroup(Common.randomString());
    });

    it('should remove a reader group', function() {
      this.acl.removeReaderGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(2);
      expect(this.json().groups.r).not.to.contain(this.group);
    });

    it('should silently succeed if the user group is not a reader', function() {
      this.acl.removeReaderGroup(Common.randomString());
      expect(this.json()).to.have.deep.property('groups.r');
      expect(this.json().groups.r).to.have.length(3);
    });

    it('should return the ACL', function() {
      const result = this.acl.removeReaderGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  describe('removeWriter()', function() {
    beforeEach(function() {
      this.acl.addWriter(Common.randomString());
      this.acl.addWriter(this.user._id);
      this.acl.addWriter(Common.randomString());
    });

    it('should remove a writer', function() {
      this.acl.removeWriter(this.user._id);
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(2);
      expect(this.json().w).not.to.contain(this.user._id);
    });

    it('should silently succeed if the user is not a writer', function() {
      this.acl.removeWriter(Common.randomString());
      expect(this.json()).to.have.property('w');
      expect(this.json().w).to.have.length(3);
    });

    it('should return the ACL', function() {
      const result = this.acl.removeReader(this.user._id);
      expect(result).to.equal(this.acl);
    });
  });

  describe('removeWriterGroup()', function() {
    before(function() {
      this.group = Common.randomString();
    });

    after(function() {
      delete this.group;
    });

    beforeEach(function() {
      this.acl.addWriterGroup(Common.randomString());
      this.acl.addWriterGroup(this.group);
      this.acl.addWriterGroup(Common.randomString());
    });

    it('should remove a writer group', function() {
      this.acl.removeWriterGroup(this.group);
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(2);
      expect(this.json().groups.w).not.to.contain(this.group);
    });

    it('should silently succeed if the user group is not a writer', function() {
      this.acl.removeWriterGroup(Common.randomString());
      expect(this.json()).to.have.deep.property('groups.w');
      expect(this.json().groups.w).to.have.length(3);
    });

    it('should return the ACL', function() {
      const result = this.acl.removeWriterGroup(this.group);
      expect(result).to.equal(this.acl);
    });
  });

  describe('setGloballyReadable()', function() {
    it('should specify the entity as globally readable', function() {
      this.acl.setGloballyReadable(true);
      expect(this.json()).to.have.property('gr', true);
    });

    it('should specify the entity as not globally readable', function() {
      this.acl.setGloballyReadable(false);
      expect(this.json()).to.have.property('gr', false);
    });

    it('should return the ACL', function() {
      const result = this.acl.setGloballyReadable();
      expect(result).to.equal(this.acl);
    });
  });

  describe('setGloballyWritable()', function() {
    it('should specify the entity as globally writable', function() {
      this.acl.setGloballyWritable(true);
      expect(this.json()).to.have.property('gw', true);
    });

    it('should specify the entity as not globally writable', function() {
      this.acl.setGloballyWritable(false);
      expect(this.json()).to.have.property('gw', false);
    });

    it('should return the ACL', function() {
      const result = this.acl.setGloballyWritable();
      expect(result).to.equal(this.acl);
    });
  });
});
