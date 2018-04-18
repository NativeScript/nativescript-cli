function testFunc() {

  const notFoundErrorName = 'NotFoundError';
  const notFoundErrorMessage = 'This blob not found for this app backend';
  const plainTextMimeType = 'text/plain';

  const assertFileMetadata = (file, expectedId, expectedMimeType, expectedFileName, byHttp) => {
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

    const expectedProtocol = byHttp ? 'http://' : 'https://';
    expect(file._downloadURL).to.contain(expectedProtocol);
    expect(file.size).to.exist;
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
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename, true);
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
            }, ttlValue + 1000);
          })
          .catch(done);
      });

      it('should return and NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
        Kinvey.Files.download(utilities.randomString())
          .catch((error) => {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
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
            assertFileMetadata(result, uploadedFile._id, plainTextMimeType, uploadedFile._filename, true);
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
            }, ttlValue + 1000);
          })
          .catch(done);
      });

      it('should return a NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
        Kinvey.Files.stream(utilities.randomString())
          .catch((error) => {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            done();
          })
          .catch(done);
      });
    });

    describe('downloadByUrl', () => {
      let uploadedFile;
      const fileContent = utilities.randomString();
      let downloadUrl;

      before((done) => {
        Kinvey.Files.upload(fileContent, { 'mimeType': plainTextMimeType })
          .then((result) => {
            uploadedFile = result;
            return Kinvey.Files.stream(uploadedFile._id)
          })
          .then((result) => {
            downloadUrl = result._downloadURL;
            done();
          })
          .catch(done);
      });

      it('should download the file by _downloadUrl', (done) => {
        Kinvey.Files.downloadByUrl(downloadUrl)
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(fileContent);
            done();
          })
          .catch(done);
      });

      it('should return an error if the url is invalid', (done) => {
        // The test should be included for execution after the fix of MLIBZ-2453
        Kinvey.Files.downloadByUrl(utilities.randomString())
        .then(() => done(new Error('Should not be called')))
        .catch((error) => {
          expect(error).to.exist;
          done();
        })
        .catch(done);
      });
    });
  });
}

runner.run(testFunc);
