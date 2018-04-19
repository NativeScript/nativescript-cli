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

    describe('Read Operations', () => {
      let uploadedFile1;
      let uploadedFile2;
      const fileContent1 = utilities.randomString();
      const fileContent2 = utilities.randomString();
      let query;

      before((done) => {
        Kinvey.Files.upload(fileContent1, { 'mimeType': plainTextMimeType })
          .then((result) => {
            uploadedFile1 = result;
            return Kinvey.Files.upload(fileContent2, { 'mimeType': plainTextMimeType })
          })
          .then((result) => {
            uploadedFile2 = result;
            query = new Kinvey.Query();
            query.equalTo('_filename', uploadedFile2._filename);
            done();
          })
          .catch(done);
      });

      describe('find', () => {
        it('should return the metadata of all files by https', (done) => {
          Kinvey.Files.find()
            .then((result) => {
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

      describe('download', () => {
        it('should download the file by _id', (done) => {
          Kinvey.Files.download(uploadedFile1._id)
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should stream the file by https with stream = true and not set tls', (done) => {
          Kinvey.Files.download(uploadedFile1._id, { stream: true })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
              return Kinvey.Files.downloadByUrl(result._downloadURL);
            })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should stream the file by https with stream = true and tls = true', (done) => {
          Kinvey.Files.download(uploadedFile1._id, { stream: true, tls: true })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
              return Kinvey.Files.downloadByUrl(result._downloadURL);
            })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should stream the file by http with stream = true and tls = false', (done) => {
          Kinvey.Files.download(uploadedFile1._id, { stream: true, tls: false })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename, true);
              done();
            })
            .catch(done);
        });

        it('should not stream the file with stream = false', (done) => {
          Kinvey.Files.download(uploadedFile1._id, { stream: false })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should set correctly ttl', (done) => {
          const ttlValue = 1;
          // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
          Kinvey.Files.download(uploadedFile1._id, { ttl: ttlValue, stream: true })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
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
        it('should stream the file by https when tls is not set', (done) => {
          Kinvey.Files.stream(uploadedFile1._id)
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
              return Kinvey.Files.downloadByUrl(result._downloadURL);
            })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should stream the file by https when tls = true', (done) => {
          Kinvey.Files.stream(uploadedFile1._id, { tls: true })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
              return Kinvey.Files.downloadByUrl(result._downloadURL);
            })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it('should stream the file by http when tls = false', (done) => {
          Kinvey.Files.stream(uploadedFile1._id, { tls: false })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename, true);
              done();
            })
            .catch(done);
        });

        it('should set correctly ttl', (done) => {
          const ttlValue = 1;
          // After the fix of MLIBZ-2453, the downloadByUrl assertion should be modified to check the error and moved to the error function
          Kinvey.Files.stream(uploadedFile1._id, { ttl: ttlValue })
            .then((result) => {
              assertFileMetadata(result, uploadedFile1._id, plainTextMimeType, uploadedFile1._filename);
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
        it('should download the file by _downloadUrl', (done) => {
          Kinvey.Files.stream(uploadedFile1._id)
            .then((result) => {
              return Kinvey.Files.downloadByUrl(result._downloadURL)
            })
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent1);
              done();
            })
            .catch(done);
        });

        it.skip('should return an error if the url is invalid', (done) => {
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
  });
}

runner.run(testFunc);
