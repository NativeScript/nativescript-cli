import { Acl } from 'src/entity';
import { randomString } from 'src/utils';
import { KinveyError } from 'src/errors';
import expect from 'expect';

describe('Acl', function() {
  describe('constructor', function() {
    it('should throw an error if an entity is not provided', function() {
      expect(() => {
        const acl = new Acl();
        return acl;
      }).toThrow(KinveyError, /entity argument must be an object/);
    });

    it('should create an empty acl when the entity does not contain an _acl property', function() {
      const entity = {};
      const acl = new Acl(entity);
      expect(acl.toPlainObject()).toEqual({});
      expect(entity._acl).toEqual({});
    });

    it('should use the _acl property on the entity', function() {
      const aclProp = { r: [] };
      const entity = { _acl: aclProp };
      const acl = new Acl(entity);
      expect(acl.toPlainObject()).toEqual(aclProp);
      expect(entity._acl).toEqual(aclProp);
    });
  });

  describe('creator', function() {
    it('should be creator value', function() {
      const creator = randomString();
      const acl = new Acl({ _acl: { creator: creator } });
      expect(acl.creator).toEqual(creator);
    });
  });

  describe('readers', function() {
    it('should return an empty array if no readers exist', function() {
      const acl = new Acl({ _acl: {} });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual([]);
    });

    it('should return an empty array if readers is not an array', function() {
      const readers = randomString();
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual([]);
    });

    it('should be readers value', function() {
      const readers = [randomString()];
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).toBeA(Array);
      expect(acl.readers).toEqual(readers);
    });
  });

  describe('writers', function() {
    it('should return an empty array if no writers exist', function() {
      const acl = new Acl({ _acl: {} });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual([]);
    });

    it('should return an empty array if writers is not an array', function() {
      const writers = randomString();
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual([]);
    });

    it('should be writers value', function() {
      const writers = [randomString()];
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).toBeA(Array);
      expect(acl.writers).toEqual(writers);
    });
  });

  describe('readerGroups', function() {
    it('should return an empty array if no readerGroups exist', function() {
      const acl = new Acl({ _acl: {} });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should return an empty array if readerGroups is not an array', function() {
      const readerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should be readerGroups value', function() {
      const readerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).toBeA(Array);
      expect(acl.readerGroups).toEqual(readerGroups);
    });
  });

  describe('writerGroups', function() {
    it('should return an empty array if no writerGroups exist', function() {
      const acl = new Acl({ _acl: {} });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual([]);
    });

    it('should return an empty array if writerGroups is not an array', function() {
      const writerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual([]);
    });

    it('should be readerGroups value', function() {
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual(writerGroups);
    });
  });

  describe('globallyReadable', function() {
    it('should not be able to set it to a string', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = 'true';
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should be set to false', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = false;
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should be set to true', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyReadable = true;
      expect(acl.isGloballyReadable()).toEqual(true);
    });
  });

  describe('globallyWritable', function() {
    it('should not be able to set it to a string', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = 'true';
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should be set to false', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = false;
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should be set to true', function() {
      const acl = new Acl({ _acl: {} });
      acl.globallyWritable = true;
      expect(acl.isGloballyWritable()).toEqual(true);
    });
  });

  describe('addReader()', function() {
    it('should not add existing reader', function() {
      const user = randomString();
      const readers = [user];
      const acl = new Acl({ _acl: { r: readers } });
      acl.addReader(user);
      expect(acl.readers).toEqual(readers);
    });

    it('should add a reader', function() {
      const entity = { _acl: {} };
      const user = randomString();
      const acl = new Acl(entity);
      acl.addReader(user);
      expect(acl.readers).toEqual([user]);
      expect(entity._acl.r).toEqual([user]);
    });
  });

  describe('addReaderGroup()', function() {
    it('should not add existing reader group', function() {
      const group = randomString();
      const readerGroups = [group];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).toEqual(readerGroups);
    });

    it('should not add existing reader group', function() {
      const group = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).toEqual([group]);
    });
  });

  describe('addWriter()', function() {
    it('should not add existing writer', function() {
      const user = randomString();
      const writers = [user];
      const acl = new Acl({ _acl: { w: writers } });
      acl.addWriter(user);
      expect(acl.writers).toEqual(writers);
    });

    it('should add a writer', function() {
      const user = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addWriter(user);
      expect(acl.writers).toEqual([user]);
    });
  });

  describe('addWriterGroup()', function() {
    it('should not add existing writer group', function() {
      const group = randomString();
      const writerGroups = [group];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.addWriterGroup(group);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should not add existing reader group', function() {
      const group = randomString();
      const acl = new Acl({ _acl: {} });
      acl.addWriterGroup(group);
      expect(acl.writerGroups).toEqual([group]);
    });
  });

  describe('isGloballyReadable()', function() {
    it('should return false', function() {
      const acl = new Acl({ _acl: { gr: false } });
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should return true', function() {
      const acl = new Acl({ _acl: { gr: true } });
      expect(acl.isGloballyReadable()).toEqual(true);
    });
  });

  describe('isGloballyWritable()', function() {
    it('should return false', function() {
      const acl = new Acl({ _acl: { gw: false } });
      expect(acl.isGloballyWritable()).toEqual(false);
    });

    it('should return true', function() {
      const acl = new Acl({ _acl: { gw: true } });
      expect(acl.isGloballyWritable()).toEqual(true);
    });
  });

  describe('removeReader()', function() {
    it('should do nothing when the reader doesn\'t exist', function() {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [] } });
      acl.removeReader(reader);
      expect(acl.readers).toEqual([]);
    });

    it('should remove the reader', function() {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [reader] } });
      acl.removeReader(reader);
      expect(acl.readers).toEqual([]);
    });
  });

  describe('removeReaderGroup()', function() {
    it('should do nothing when the reader group doesn\'t exist', function() {
      const readerGroup = randomString();
      const acl = new Acl({ _acl: { groups: { r: [] } } });
      acl.removeReaderGroup(readerGroup);
      expect(acl.readerGroups).toEqual([]);
    });

    it('should remove the reader group', function() {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: groups } } });
      acl.addReaderGroup(group);
      acl.removeReaderGroup(group);
      expect(acl.readerGroups).toEqual(groups);
    });
  });

  describe('removeWriter()', function() {
    it('should do nothing when the writer doesn\'t exist', function() {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [] } });
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([]);
    });

    it('should remove the writer', function() {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [writer] } });
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([]);
    });
  });

  describe('removeWriterGroup()', function() {
    it('should do nothing when the writer group doesn\'t exist', function() {
      const writerGroup = randomString();
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.removeWriterGroup(writerGroup);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should remove the writer group', function() {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: groups } } });
      acl.addWriterGroup(group);
      acl.removeWriterGroup(group);
      expect(acl.writerGroups).toEqual(groups);
    });
  });

  describe('toPlainObject()', function() {
    it('should return object', function() {
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
