function testFunc() {

  const assertFileMetadata = (file, expectedId, expectedMimeType, expectedFileName) => {
    if (expectedId) {
      expect(file._id).to.equal(expectedId);
    } else {
      expect(file._id).to.exist;
    }

    if (expectedMimeType) {
      expect(file.mimeType).to.equal(expectedMimeType);
    } else {
      expect(file.mimeType).to.exist;
    }

    if (expectedFileName) {
      expect(file._filename).to.equal(expectedFileName);
    } else {
      expect(file._filename).to.exist;
    }

    expect(file.size).to.exist;
    expect(file._downloadURL).to.exist;
    expect(file._expiresAt).to.exist;

    expect(file._acl.creator).to.exist;
    expect(file._kmd.ect).to.exist;
    expect(file._kmd.lmt).to.exist;
  };

  describe('Files', () => {

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('download', () => {
      let uploadedFile;
      const fileContent = utilities.randomString();

      before((done) => {
        Kinvey.Files.upload(fileContent, { 'mimeType': 'text/plain' })
          .then((result) => { uploadedFile = result; })
          .then(() => done())
          .catch(done);
      });

      it('should download the file by _id', (done) => {
        Kinvey.Files.download(uploadedFile._id)
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should stream the file with stream = true', (done) => {
        Kinvey.Files.download(uploadedFile._id, { stream: true })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, 'text/plain', uploadedFile._filename);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should set correctly ttl', (done) => {
        // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
        Kinvey.Files.download(uploadedFile._id, { stream: true, ttl: 0 })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, 'text/plain', uploadedFile._filename);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.contain('The provided token has expired.')
            done();
          })
          .catch(done);
      });
    });
  });
}

runner.run(testFunc);
