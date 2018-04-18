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

  const plainTextMimeType = 'text/plain';

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
        Kinvey.Files.upload(fileContent, { 'mimeType': plainTextMimeType })
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

      it('should stream the file by https with stream = true and not set tls', (done) => {
        Kinvey.Files.download(uploadedFile._id, { stream: true })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('https://');
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should stream the file by https with stream = true and tls = true', (done) => {
        Kinvey.Files.download(uploadedFile._id, { stream: true, tls: true })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('https://');
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should stream the file by http with stream = true and tls = false', (done) => {
        Kinvey.Files.download(uploadedFile._id, { stream: true, tls: false })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('http://');
            done();
          })
          .catch(done);
      });

      it('should not stream the file with stream = false', (done) => {
        Kinvey.Files.download(uploadedFile._id, { stream: false })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should set correctly ttl', (done) => {
        const ttlValue = 1;
        // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
        Kinvey.Files.download(uploadedFile._id, { ttl: ttlValue, stream: true })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            setTimeout(() => {
              return Kinvey.Files.downloadByUrl(result._downloadURL)
                .then((result) => {
                  expect(result).to.contain('The provided token has expired.')
                  done();
                })
                .catch(done);
            }, ttlValue + 500);
          })
          .catch(done);
      });

      it('should return and error if the file with the supplied _id does not exist on the server', (done) => {
        Kinvey.Files.download(utilities.randomString())
          .catch((error) => {
            expect(error.message).to.equal('This blob not found for this app backend');
            done();
          })
          .catch(done);
      });
    });

    describe('stream', () => {
      let uploadedFile;
      const fileContent = utilities.randomString();

      before((done) => {
        Kinvey.Files.upload(fileContent, { 'mimeType': plainTextMimeType })
          .then((result) => { uploadedFile = result; })
          .then(() => done())
          .catch(done);
      });

      it('should stream the file by https when tls is not set', (done) => {
        Kinvey.Files.stream(uploadedFile._id)
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('https://');
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should stream the file by https when tls = true', (done) => {
        Kinvey.Files.stream(uploadedFile._id, { tls: true })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('https://');
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should stream the file by http when tls = false', (done) => {
        Kinvey.Files.stream(uploadedFile._id, { tls: false })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            expect(result._downloadURL).to.contain('http://');
            done();
          })
          .catch(done);
      });

      it('should set correctly ttl', (done) => {
        const ttlValue = 1;
        // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
        Kinvey.Files.stream(uploadedFile._id, { ttl: ttlValue })
          .then((result) => {
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename);
            setTimeout(() => {
              return Kinvey.Files.downloadByUrl(result._downloadURL)
                .then((result) => {
                  expect(result).to.contain('The provided token has expired.')
                  done();
                })
                .catch(done);
            }, ttlValue + 500);
          })
          .catch(done);
      });

      it('should return and error if the _id does not exist', (done) => {
        Kinvey.Files.stream(utilities.randomString())
          .catch((error) => {
            expect(error.message).to.equal('This blob not found for this app backend');
            done();
          })
          .catch(done);
      });
    });
  });
}

runner.run(testFunc);
