import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { init, Files, Query } from '__SDK__';

before(() => {
  return init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});

describe('Files', () => {
  describe('find()', () => {
    let uploadedFile;

    before(async () => {
      const testFile = fs.readFileSync(path.resolve(__dirname, './test.png'));
      const filename = 'test.png';
      const mimeType = 'image/png';
      const size = testFile.length;
      uploadedFile = await Files.upload(testFile, {
        filename: 'test.png',
        mimeType: 'image/png',
        size
      });
    });

    after(async () => {
      await Files.removeById(uploadedFile._id);
      uploadedFile = undefined;
    });

    it('should find the files', async () => {
      const files = await Files.find();
      expect(files.length).to.equal(1);
      const file = files[0];
      expect(file._id).to.equal(uploadedFile._id);
      expect(file._filename).to.equal(uploadedFile._filename);
      expect(file.mimeType).to.equal(uploadedFile.mimeType);
      expect(file.size).to.equal(uploadedFile.size);
      expect(file._downloadURL).to.exist;
    });
  });

  describe('upload()', () => {
    it('should upload a file', async () => {
      const testFile = fs.readFileSync(path.resolve(__dirname, './test.png'));
      const filename = 'test.png';
      const mimeType = 'image/png';
      const size = testFile.length;

      // Upload the file
      const file = await Files.upload(testFile, {
        public: true,
        filename: 'test.png',
        mimeType: 'image/png',
        size
      });

      // Expectations
      expect(file._id).to.not.be.undefined;
      expect(file._filename).to.equal(filename);
      expect(file.mimeType).to.equal(mimeType);
      expect(file.size).to.equal(size);

      // Remove the file
      await Files.removeById(file._id);
    });
  });
});
