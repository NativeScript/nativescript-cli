const { Acl } = require('../src');
const { randomString } = require('kinvey-utils/string');
const { KinveyError } = require('kinvey-errors');
const expect = require('expect');

describe('Acl', () => {
  describe('constructor', () => {
    it('should throw an error if an entity is not provided', () => {
      expect(() => {
        const acl = new Acl();
        return acl;
      }).toThrow(KinveyError, /entity argument must be an object/);
    });

    it('should create an empty acl when the entity does not contain an _acl property', () => {
      const entity = {};
      const acl = new Acl(entity);
      expect(acl.toPlainObject()).toEqual({});
      expect(entity._acl).toEqual({});
    });

    it('should use the _acl property on the entity', () => {
      const aclProp = { r: [] };
      const entity = { _acl: aclProp };
      const acl = new Acl(entity);
      expect(acl.toPlainObject()).toEqual(aclProp);
      expect(entity._acl).toEqual(aclProp);
    });
  });

  describe('creator', () => {
    it('should be creator value', () => {
      const creator = randomString();
      const acl = new Acl({ _acl: { creator: creator } });
      expect(acl.creator).toEqual(creator);
    });
  });

  describe('readers', () => {
    it('should return an empty array if no readers exist', () => {
      const acl = new Acl({ _acl: {} });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual([]);
    });

    it('should return an empty array if readers is not an array', () => {
      const readers = randomString();
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual([]);
    });

    it('should be readers value', () => {
      const readers = [randomString()];
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual(readers);
    });
  });

  describe('writers', () => {
    it('should return an empty array if no writers exist', () => {
      const acl = new Acl({ _acl: {} });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual([]);
    });

    it('should return an empty array if writers is not an array', () => {
      const writers = randomString();
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual([]);
    });

    it('should be writers value', () => {
      const writers = [randomString()];
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual(writers);
    });
  });

  describe('readerGroups', () => {
    it('should return an empty array if no readerGroups exist', () => {
      const acl = new Acl({ _acl: {} });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should return an empty array if readerGroups is not an array', () => {
      const readerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should be readerGroups value', () => {
      const readerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual(readerGroups);
    });
  });

  describe('writerGroups', () => {
    it('should return an empty array if no writerGroups exist', () => {
      const acl = new Acl({ _acl: {} });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual([]);
    });

    it('should return an empty array if writerGroups is not an array', () => {
      const writerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual([]);
    });

    it('should be readerGroups value', () => {
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual(writerGroups);
    });
  });

  describe('globallyReadable', () => {
    it('should not be able to set it to a string', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = 'true';
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should be set to false', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = false;
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should be set to true', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = true;
      expect(acl.isGloballyReadable()).toEqual(true);
    });
  });

  describe('globallyWritable', () => {
    it('should not be able to set it to a string', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = 'true';
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should be set to false', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = false;
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should be set to true', () => {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = true;
      expect(acl.isGloballyWritable()).toEqual(true);
    });
  });

  describe('addReader()', () => {
    it('should not add existing reader', () => {
      const user = randomString();
      const readers = [user];
      const acl = new Acl({ _acl: { r: readers } });
      acl.addReader(user);
      expect(acl.readers).toEqual(readers);
    });

    it('should add a reader', () => {
      const entity = { _acl: {} };
      const user = randomString();
      const acl = new Acl(entity);
      acl.addReader(user);
      expect(acl.readers).toEqual([user]);
      expect(entity._acl.r).toEqual([user]);
    });
  });

  describe('addReaderGroup()', () => {
    it('should not add existing reader group', () => {
      const group = randomString();
      const readerGroups = [group];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).toEqual(readerGroups);
    });

    it('should not add existing reader group', () => {
      const group = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).toEqual([group]);
    });
  });

  describe('addWriter()', () => {
    it('should not add existing writer', () => {
      const user = randomString();
      const writers = [user];
      const acl = new Acl({ _acl: { w: writers } });
      acl.addWriter(user);
      expect(acl.writers).toEqual(writers);
    });

    it('should add a writer', () => {
      const user = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addWriter(user);
      expect(acl.writers).toEqual([user]);
    });
  });

  describe('addWriterGroup()', () => {
    it('should not add existing writer group', () => {
      const group = randomString();
      const writerGroups = [group];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.addWriterGroup(group);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should not add existing reader group', () => {
      const group = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addWriterGroup(group);
      expect(acl.writerGroups).toEqual([group]);
    });
  });

  describe('isGloballyReadable()', () => {
    it('should return false', () => {
      const acl = new Acl({ _acl: { gr: false } });
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should return true', () => {
      const acl = new Acl({ _acl: { gr: true } });
      expect(acl.isGloballyReadable()).toEqual(true);
    });
  });

  describe('isGloballyWritable()', () => {
    it('should return false', () => {
      const acl = new Acl({ _acl: { gw: false } });
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should return true', () => {
      const acl = new Acl({ _acl: { gw: true } });
      expect(acl.isGloballyWritable()).toEqual(true);
    });
  });

  describe('removeReader()', () => {
    it('should do nothing when the reader doesn\'t exist', () => {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [] } });
      acl.removeReader(reader);
      expect(acl.readers).toEqual([]);
    });

    it('should remove the reader', () => {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [reader] } });
      acl.removeReader(reader);
      expect(acl.readers).toEqual([]);
    });
  });

  describe('removeReaderGroup()', () => {
    it('should do nothing when the reader group doesn\'t exist', () => {
      const readerGroup = randomString();
      const acl = new Acl({ _acl: { groups: { r: [] } } });
      acl.removeReaderGroup(readerGroup);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should remove the reader group', () => {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: groups } } });
      acl.addReaderGroup(group);
      acl.removeReaderGroup(group);
      expect(acl.readerGroups).toEqual(groups);
    });
  });

  describe('removeWriter()', () => {
    it('should do nothing when the writer doesn\'t exist', () => {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [] } });
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([]);
    });

    it('should remove the writer', () => {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [writer] } });
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([]);
    });
  });

  describe('removeWriterGroup()', () => {
    it('should do nothing when the writer group doesn\'t exist', () => {
      const writerGroup = randomString();
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.removeWriterGroup(writerGroup);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should remove the writer group', () => {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: groups } } });
      acl.addWriterGroup(group);
      acl.removeWriterGroup(group);
      expect(acl.writerGroups).toEqual(groups);
    });
  });

  describe('toPlainObject()', () => {
    it('should return object', () => {
      const _acl = {
        gr: true,
        gw: false,
        readers: [randomString()],
        writers: [randomString()],
        groups: {
          r: [randomString()],
          w: [randomString()]
        }
      };
      const acl = new Acl({ _acl: _acl });
      expect(acl.toPlainObject()).toEqual(_acl);
    });
  });
});
