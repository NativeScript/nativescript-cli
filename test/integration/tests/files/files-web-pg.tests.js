function testFunc() {

  const notFoundErrorName = 'NotFoundError';
  const notFoundErrorMessage = 'This blob not found for this app backend';
  const plainTextMimeType = 'text/plain';
  const shouldNotBeCalledMessage = 'Should not be called';

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

  const uploadFiles = (files) => {
    return Promise.all(files.map(file => {
      return Kinvey.Files.upload(file, { 'mimeType': plainTextMimeType });
    }))
  }

  describe('Files', () => {

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('upload()', () => {

      beforeEach((done) => {
        Kinvey.User.logout()
          .then(() => Kinvey.User.signup())
          .then(() => done())
          .catch(done);
      });

      it.skip('should upload a file by string content', (done) => {
        const stringContent = utilities.randomString();
        const fileName = 'some_file.txt';
        const metadata = {
          _id: utilities.randomString(),
          filename: fileName,
          mimeType: 'text/plain'
        };
        Kinvey.Files.upload(stringContent, metadata)
          .then((result) => {
            debugger
            expect(result).to.be.an('array');
            expect(result.length).to.equal(2);
            const file1 = result.find(file => file._id === uploadedFile1._id);
            const file2 = result.find(file => file._id === uploadedFile2._id);
            assertFileMetadata(file1, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
            assertFileMetadata(file2, uploadedFile2._id, plainTextMimeType, uploadedFile2._filename);
            done();
          })
          .catch(done);
      });

      it('should return the metadata for all files that match the query', (done) => {
        Kinvey.Files.find(query)
          .then((result) => {
            expect(result).to.be.an('array');
            expect(result.length).to.equal(1);
            assertFileMetadata(result[0], uploadedFile2._id, plainTextMimeType, uploadedFile2._filename);
            done();
          })
          .catch(done);
      });

      it('should return the file by http if tls = false', (done) => {
        Kinvey.Files.find(query, { tls: false })
          .then((result) => {
            assertFileMetadata(result[0], uploadedFile2._id, plainTextMimeType, uploadedFile2._filename, true);
            done();
          })
          .catch(done);
      });

      it('should set correctly ttl', (done) => {
        const ttlValue = 1;
        // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
        Kinvey.Files.find(query, { ttl: ttlValue })
          .then((result) => {
            assertFileMetadata(result[0], uploadedFile2._id, plainTextMimeType, uploadedFile2._filename);
            setTimeout(() => {
              return Kinvey.Files.downloadByUrl(result[0]._downloadURL)
                .then((result) => {
                  expect(result).to.contain('The provided token has expired.')
                  done();
                })
                .catch(done);
            }, ttlValue + 1000);
          })
          .catch(done);
      });

      it('should download all files with download = true', (done) => {
        Kinvey.Files.find(null, { download: true })
          .then((result) => {
            expect(result).to.be.an('array');
            expect(result.length).to.equal(2);
            expect(result.find(fileContent => fileContent === fileContent1)).to.exist;
            expect(result.find(fileContent => fileContent === fileContent2)).to.exist;
            done();
          })
          .catch(done);
      });

      it('should download all files which match the query with download = true', (done) => {
        Kinvey.Files.find(query, { download: true })
          .then((result) => {
            expect(result).to.be.an('array');
            expect(result.length).to.equal(1);
            expect(result[0]).to.equal(fileContent2);
            done();
          })
          .catch(done);
      });
    });
  });
}

runner.run(testFunc);
