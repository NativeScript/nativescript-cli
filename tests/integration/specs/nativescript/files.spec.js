import { expect } from 'chai';
import _ from 'lodash';
import { knownFolders, path, File } from 'tns-core-modules/file-system';
import * as Kinvey from '__SDK__';
import * as utilities from '../utils';

describe('Files', function() {
  before(function() {
    const config = Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
    return utilities.cleanUpCollection(config, '_blob');
  });

  before(function() {
    return Kinvey.User.signup({
      username: utilities.randomString(),
      password: utilities.randomString()
    });
  });

  after(function() {
    const activeUser = Kinvey.User.getActiveUser();
    console.log(activeUser);
    if (activeUser) {
      return Kinvey.User.remove(activeUser._id, { hard: true });
    }
  });

  describe('upload()', function() {
    it('should upload a file by providing a {N} file', async function() {
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const file = File.fromPath(filePath);
      const kinveyFile = await Kinvey.Files.upload(filePath);
      expect(kinveyFile._filename).to.equal('test1.txt');
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it('should upload a file by providing the file path', async function() {
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const kinveyFile = await Kinvey.Files.upload(filePath);
      expect(kinveyFile._filename).to.equal('test1.txt');
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it('should upload with mimeType application/octet-stream by default', async function() {
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const kinveyFile = await Kinvey.Files.upload(filePath);
      expect(file.mimeType).to.equal('application/octet-stream');
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it('should upload with provided mimeType', async function() {
      const mimeType = 'text/plain';
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const kinveyFile = await Kinvey.Files.upload(filePath, { mimeType });
      expect(file.mimeType).to.equal(mimeType);
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it('should set custom properties', async function() {
      const metadata = { testProperty: 'test' };
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const kinveyFile = await Kinvey.Files.upload(filePath, metadata);
      expect(file.testProperty).to.equal(metadata.testProperty);
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it.skip('should set _acl');

    it('should upload a publicly-readable file with public set to true', async function() {
      const filePath = path.join(knownFolders.currentApp().path, '/sample-test-files/test1.txt');
      const kinveyFile = await Kinvey.Files.upload(filePath, { public: true });
      expect(file._public).to.equal(true);
      return Kinvey.Files.removeById(kinveyFile._id);
    });

    it.skip('should update the content and the metadata of an existing file');
  });
});
