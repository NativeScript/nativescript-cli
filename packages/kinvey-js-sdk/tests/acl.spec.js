import { expect } from 'chai';
import Acl from '../src/acl';
import { randomString } from './utils';

describe('Acl', () => {
  describe('creator', () => {
    it('should be creator value', () => {
      const creator = randomString();
      const acl = new Acl({ _acl: { creator } });
      expect(acl.creator).to.equal(creator);
    });
  });

  describe('readers', () => {
    it('should return an empty array if no readers exist', () => {
      const acl = new Acl();
      expect(acl.readers).to.deep.equal([]);
    });

    it('should return an empty array if readers is not an array', () => {
      const readers = randomString();
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).to.deep.equal([]);
    });

    it('should be readers value', () => {
      const readers = [randomString()];
      const acl = new Acl({ _acl: { r: readers } });
      expect(acl.readers).to.equal(readers);
    });
  });

  describe('writers', () => {
    it('should return an empty array if no writers exist', () => {
      const acl = new Acl();
      expect(acl.writers).to.deep.equal([]);
    });

    it('should return an empty array if writers is not an array', () => {
      const writers = randomString();
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).to.deep.equal([]);
    });

    it('should be writers value', () => {
      const writers = [randomString()];
      const acl = new Acl({ _acl: { w: writers } });
      expect(acl.writers).to.equal(writers);
    });
  });

  describe('readerGroups', () => {
    it('should return an empty array if no readerGroups exist', () => {
      const acl = new Acl();
      expect(acl.readerGroups).to.deep.equal([]);
    });

    it('should return an empty array if readerGroups is not an array', () => {
      const readerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).to.deep.equal([]);
    });

    it('should be readerGroups value', () => {
      const readerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      expect(acl.readerGroups).to.equal(readerGroups);
    });
  });

  describe('writerGroups', () => {
    it('should return an empty array if no writerGroups exist', () => {
      const acl = new Acl();
      expect(acl.writerGroups).to.deep.equal([]);
    });

    it('should return an empty array if writerGroups is not an array', () => {
      const writerGroups = randomString();
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).to.deep.equal([]);
    });

    it('should be readerGroups value', () => {
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      expect(acl.writerGroups).to.equal(writerGroups);
    });
  });

  describe('globallyReadable', () => {
    it('should not be able to set it to a string', () => {
      const acl = new Acl();
      acl.globallyReadable = 'true';
      expect(acl.isGloballyReadable()).to.equal(false);
    });

    it('should be set to false', () => {
      const acl = new Acl();
      acl.globallyReadable = false;
      expect(acl.isGloballyReadable()).to.equal(false);
    });

    it('should be set to true', () => {
      const acl = new Acl();
      acl.globallyReadable = true;
      expect(acl.isGloballyReadable()).to.equal(true);
    });
  });

  describe('globallyWritable', () => {
    it('should not be able to set it to a string', () => {
      const acl = new Acl();
      acl.globallyWritable = 'true';
      expect(acl.isGloballyWritable()).to.equal(false);
    });

    it('should be set to false', () => {
      const acl = new Acl();
      acl.globallyWritable = false;
      expect(acl.isGloballyWritable()).to.equal(false);
    });

    it('should be set to true', () => {
      const acl = new Acl();
      acl.globallyWritable = true;
      expect(acl.isGloballyWritable()).to.equal(true);
    });
  });

  describe('addReader()', () => {
    it('should not add existing reader', () => {
      const user = randomString();
      const readers = [user];
      const acl = new Acl({ _acl: { r: readers } });
      acl.addReader(user);
      expect(acl.readers).to.equal(readers);
    });

    it('should add a reader', () => {
      const user = randomString();
      const acl = new Acl();
      acl.addReader(user);
      expect(acl.readers).to.deep.equal([user]);
    });
  });

  describe('addReaderGroup()', () => {
    it('should not add existing reader group', () => {
      const group = randomString();
      const readerGroups = [group];
      const acl = new Acl({ _acl: { groups: { r: readerGroups } } });
      acl.addReaderGroup(group);
      expect(acl.readerGroups).to.deep.equal(readerGroups);
    });

    it('should add reader group', () => {
      const group = randomString();
      const acl = new Acl();
      acl.addReaderGroup(group);
      expect(acl.readerGroups).to.deep.equal([group]);
    });
  });

  describe('addWriter()', () => {
    it('should not add existing writer', () => {
      const user = randomString();
      const writers = [user];
      const acl = new Acl({ _acl: { w: writers } });
      acl.addWriter(user);
      expect(acl.writers).to.equal(writers);
    });

    it('should add a writer', () => {
      const user = randomString();
      const acl = new Acl();
      acl.addWriter(user);
      expect(acl.writers).to.deep.equal([user]);
    });
  });

  describe('addWriterGroup()', () => {
    it('should not add existing writer group', () => {
      const group = randomString();
      const writerGroups = [group];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.addWriterGroup(group);
      expect(acl.writerGroups).to.equal(writerGroups);
    });

    it('should add writer group', () => {
      const group = randomString();
      const acl = new Acl();
      acl.addWriterGroup(group);
      expect(acl.writerGroups).to.deep.equal([group]);
    });
  });

  describe('isGloballyReadable()', () => {
    it('should return false', () => {
      const acl = new Acl({ _acl: { gr: false } });
      expect(acl.isGloballyReadable()).to.equal(false);
    });

    it('should return true', () => {
      const acl = new Acl({ _acl: { gr: true } });
      expect(acl.isGloballyReadable()).to.equal(true);
    });
  });

  describe('isGloballyWritable()', () => {
    it('should return false', () => {
      const acl = new Acl({ _acl: { gw: false } });
      expect(acl.isGloballyWritable()).to.equal(false);
    });

    it('should return true', () => {
      const acl = new Acl({ _acl: { gw: true } });
      expect(acl.isGloballyWritable()).to.equal(true);
    });
  });

  describe('removeReader()', () => {
    it('should do nothing when the reader doesn\'t exist', () => {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [] } });
      acl.removeReader(reader);
      expect(acl.readers).to.deep.equal([]);
    });

    it('should remove the reader', () => {
      const reader = randomString();
      const acl = new Acl({ _acl: { r: [reader] } });
      acl.removeReader(reader);
      expect(acl.readers).to.deep.equal([]);
    });
  });

  describe('removeReaderGroup()', () => {
    it('should do nothing when the reader group doesn\'t exist', () => {
      const readerGroup = randomString();
      const acl = new Acl({ _acl: { groups: { r: [] } } });
      acl.removeReaderGroup(readerGroup);
      expect(acl.readerGroups).to.deep.equal([]);
    });

    it('should remove the reader group', () => {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { r: groups } } });
      acl.addReaderGroup(group);
      acl.removeReaderGroup(group);
      expect(acl.readerGroups).to.equal(groups);
    });
  });

  describe('removeWriter()', () => {
    it('should do nothing when the writer doesn\'t exist', () => {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [] } });
      acl.removeWriter(writer);
      expect(acl.writers).to.deep.equal([]);
    });

    it('should remove the writer', () => {
      const writer = randomString();
      const acl = new Acl({ _acl: { w: [writer] } });
      acl.removeWriter(writer);
      expect(acl.writers).to.deep.equal([]);
    });
  });

  describe('removeWriterGroup()', () => {
    it('should do nothing when the writer group doesn\'t exist', () => {
      const writerGroup = randomString();
      const writerGroups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: writerGroups } } });
      acl.removeWriterGroup(writerGroup);
      expect(acl.writerGroups).to.equal(writerGroups);
    });

    it('should remove the writer group', () => {
      const group = randomString();
      const groups = [randomString()];
      const acl = new Acl({ _acl: { groups: { w: groups } } });
      acl.addWriterGroup(group);
      acl.removeWriterGroup(group);
      expect(acl.writerGroups).to.equal(groups);
    });
  });
});
