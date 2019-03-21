import expect from 'expect';
import { randomString } from '../tests/utils';
import KinveyError from './errors/kinvey';
import Acl from './acl';

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
      const acl = new Acl({ _acl: { creator } });
      expect(acl.creator).toEqual(creator);
    });

    it('should not be able to directly set it', () => {
      const creator = randomString();
      const acl = new Acl({ _acl: { creator } });
      expect(() => { acl.creator = randomString() }).toThrow(/Cannot set property creator of #<Acl> which has only a getter/)
    })
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

    it('should not be set directly through the readers property', () => {
      const readers = [randomString()];
      const acl = new Acl({ _acl: { r: readers } });
      expect(() => { acl.readers = [randomString()] }).toThrow(/Cannot set property readers of #<Acl> which has only a getter/);
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

    it('should not be set directly through the writers property', () => {
      const writers = [randomString()];
      const acl = new Acl({ _acl: { w: writers } });
      expect(() => { acl.writers = [randomString()] }).toThrow(/Cannot set property writers of #<Acl> which has only a getter/);
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

    it('should not be set directly through the readerGroups property', () => {
      const readerGroups = [randomString()];
      const acl = new Acl({ _acl: { rg: readerGroups } });
      expect(() => { acl.readerGroups = [randomString()] }).toThrow(/Cannot set property readerGroups of #<Acl> which has only a getter/);
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

    it('should be writerGroups value', () => {
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).toBeA(Array);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should not be set directly through the writerGroups property', () => {
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { rg: writerGroups } });
      expect(() => { acl.writerGroups = [randomString()] }).toThrow(/Cannot set property writerGroups of #<Acl> which has only a getter/);
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

    it('should append new reader without overriding the old one', () => {
      const entity = { _acl: {} };
      const user = randomString();
      const acl = new Acl(entity);
      const newReader = randomString();
      acl.addReader(user);
      expect(acl.readers).toEqual([user]);
      expect(entity._acl.r).toEqual([user]);
      acl.addReader(newReader);
      expect(acl.readers).toContain(user);
      expect(acl.readers).toContain(newReader);
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

    it('should not remove writer groups', () => {
      const group = randomString();
      const readerGroups = [group];
      const writerGroups = [group];
      const acl = new Acl({ _acl: { groups: { r: readerGroups, w: writerGroups } } });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).toEqual(readerGroups);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should append new readerGroup without overriding the old one', () => {
      const entity = { _acl: {} };
      const readerGroup = randomString();
      const acl = new Acl(entity);
      const newReaderGroup = randomString();
      acl.addReaderGroup(readerGroup);
      expect(acl.readerGroups).toEqual([readerGroup]);
      expect(entity._acl.groups.r).toEqual([readerGroup]);
      acl.addReaderGroup(newReaderGroup);
      expect(acl.readerGroups).toContain(readerGroup);
      expect(acl.readerGroups).toContain(newReaderGroup);
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

    it('should append new writer without overriding the old one', () => {
      const entity = { _acl: {} };
      const writer = randomString();
      const acl = new Acl(entity);
      const newWriter = randomString();
      acl.addWriter(writer);
      expect(acl.writers).toEqual([writer]);
      expect(entity._acl.w).toEqual([writer]);
      acl.addWriter(newWriter);
      expect(acl.writers).toContain(writer);
      expect(acl.writers).toContain(newWriter);
    });

    it('should append new readerGroup without deleting the writerGroup', () => {
      const entity = { _acl: {} };
      const writerGroup = randomString();
      const acl = new Acl(entity);
      const readerGroup = randomString();
      acl.addWriterGroup(writerGroup);
      expect(acl.writerGroups).toEqual([writerGroup]);
      expect(entity._acl.groups.w).toEqual([writerGroup]);
      acl.addReaderGroup(readerGroup);
      expect(acl.readerGroups.length).toEqual(1);
      expect(acl.writerGroups.length).toEqual(1);
      expect(acl.writerGroups).toContain(writerGroup);
      expect(acl.readerGroups).toContain(readerGroup);
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

    it('should not remove reader groups', () => {
      const group = randomString();
      const readerGroups = [group];
      const writerGroups = [group];
      const acl = new Acl({ _acl: { groups: { r: readerGroups, w: writerGroups } } });
      acl.addWriterGroup(group);
      expect(acl.readerGroups).toEqual(readerGroups);
      expect(acl.writerGroups).toEqual(writerGroups);
    });

    it('should append new writerGroup without overriding the old one', () => {
      const entity = { _acl: {} };
      const writerGroup = randomString();
      const acl = new Acl(entity);
      const newWriterGroup = randomString();
      acl.addWriterGroup(writerGroup);
      expect(acl.writerGroups).toEqual([writerGroup]);
      expect(entity._acl.groups.w).toEqual([writerGroup]);
      acl.addWriterGroup(newWriterGroup);
      expect(acl.writerGroups).toContain(writerGroup);
      expect(acl.writerGroups).toContain(newWriterGroup);
    });

    it('should append new writerGroup without deleting the readerGroup', () => {
      const entity = { _acl: {} };
      const readerGroup = randomString();
      const acl = new Acl(entity);
      const writerGroup = randomString();
      acl.addReaderGroup(readerGroup);
      expect(acl.readerGroups).toEqual([readerGroup]);
      expect(entity._acl.groups.r).toEqual([readerGroup]);
      acl.addWriterGroup(writerGroup);
      expect(acl.readerGroups.length).toEqual(1);
      expect(acl.writerGroups.length).toEqual(1);
      expect(acl.readerGroups).toContain(readerGroup);
      expect(acl.writerGroups).toContain(writerGroup);
    });
  });

  describe('isGloballyReadable()', () => {
    it('should return false', () => {
      const acl = new Acl({ _acl: { gr: false } });
      expect(acl.isGloballyReadable()).toEqual(false);
    });

    it('should return false if gr is not set explicitly', () => {
      const acl = new Acl({ _acl: {} });
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

    it('should return false if gw is not set explicitly', () => {
      const acl = new Acl({ _acl: {} });
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
      const anotherReader = randomString();
      const acl = new Acl({ _acl: { r: [] } });
      acl.addReader(anotherReader);
      acl.removeReader(reader);
      expect(acl.readers).toEqual([anotherReader]);
    });

    it('should remove the reader', () => {
      const reader = randomString();
      const anotherReader = randomString();
      const acl = new Acl({ _acl: { r: [reader] } });
      acl.addReader(anotherReader);
      acl.removeReader(reader);
      expect(acl.readers).toEqual([anotherReader]);
    });
  });

  describe('removeReaderGroup()', () => {
    it('should do nothing when the reader group doesn\'t exist', () => {
      const readerGroup = randomString();
      const anotherReaderGroup = randomString();
      const acl = new Acl({ _acl: { groups: { r: [] } } });
      acl.addReaderGroup(anotherReaderGroup);
      acl.removeReaderGroup(readerGroup);
      expect(acl.readerGroups).toEqual([anotherReaderGroup]);
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
      const anotherWriter = randomString();
      const acl = new Acl({ _acl: { w: [] } });
      acl.addWriter(anotherWriter)
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([anotherWriter]);
    });

    it('should remove the writer', () => {
      const writer = randomString();
      const anotherWriter = randomString();
      const acl = new Acl({ _acl: { w: [writer] } });
      acl.addWriter(anotherWriter)
      acl.removeWriter(writer);
      expect(acl.writers).toEqual([anotherWriter]);
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
      const acl = new Acl({ _acl });
      expect(acl.toPlainObject()).toEqual(_acl);
    });
  });
});
