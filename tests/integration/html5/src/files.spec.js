import { expect } from 'chai';
import _ from 'lodash';
import * as Kinvey from 'kinvey-html5-sdk';
import * as utilities from './utils';

let appCredentials;

describe('Files', () => {
  before(() => {
    appCredentials = Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

  before(()=>{
    utilities.cleanUpCollection(appCredentials, '_blob');
  })

  before(async () => {
    return Kinvey.User.signup({
      username: utilities.randomString(),
      password: utilities.randomString()
    });
  });

  after(() => {
    const activeUser = Kinvey.User.getActiveUser();
    return Kinvey.User.remove(activeUser._id, { hard: true });
  });

  describe('find()', () => {
    let uploadedFile;

    before(async () => {
      const testFile = utilities.randomString();
      const filename = `${utilities.randomString()}.txt`;
      const mimeType = 'text/plain';
      const size = testFile.length;
      uploadedFile = await Kinvey.Files.upload(testFile, {
        filename,
        mimeType,
        size
      });
    });

    after(async () => {
      await Kinvey.Files.removeById(uploadedFile._id);
      uploadedFile = undefined;
    });

    it('should find the files', async () => {
      const files = await Kinvey.Files.find();
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
      const testFile = utilities.randomString();
      const filename = `${utilities.randomString()}.txt`;
      const mimeType = 'text/plain';
      const size = testFile.length;

      // Upload the file
      const file = await Kinvey.Files.upload(testFile, {
        public: true,
        filename,
        mimeType,
        size
      });

      // Expectations
      expect(file._id).to.not.be.undefined;
      expect(file._filename).to.equal(filename);
      expect(file.mimeType).to.equal(mimeType);
      expect(file.size).to.equal(size);

      // Remove the file
      await Kinvey.Files.removeById(file._id);
    });
  });
  const notFoundErrorName = 'NotFoundError';
  const notFoundErrorMessage = 'This blob not found for this app backend.';
  const plainTextMimeType = 'text/plain';
  const octetStreamMimeType = 'application/octet-stream';
  const shouldNotBeCalledMessage = 'Should not be called';

  const uploadFiles = (files) => {
    return Promise.all(files.map(file => {
      return Kinvey.Files.upload(file, { mimeType: plainTextMimeType });
    }));
  };

  describe('Files Common tests', () => {
    let fileToUpload1;
    let fileToUpload2;
    // The string content should match the content of the used sample files test1.txt and test2.txt in test/integration/sample-test-files
    const fileContent1 = 'some_text1';
    const fileContent2 = 'some_text2';

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => {
          // Check if the runtime is {N} and set fileToUpload to file path, as Files.upload() works by file path in {N}
          // Files.upload() itself is tested per shim in other suites
          try {
            const fs = require('tns-core-modules/file-system');
            const sampleTestFilesPath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files');
            fileToUpload1 = fs.path.join(sampleTestFilesPath, 'test1.txt');
            fileToUpload2 = fs.path.join(sampleTestFilesPath, 'test2.txt');
          } catch (error) {
            //expect(error instanceof ReferenceError).to.be.true; //TODO error is not an instance of referenceError
            fileToUpload1 = fileContent1;
            fileToUpload2 = fileContent2;
          };
          done();
        })
        .catch(done);
    });

    describe('Read Operations', () => {
      let uploadedFile1;
      let uploadedFile2;
      let query;
      let file1Metadata;
      let file2Metadata;

      before((done) => {
        uploadFiles([fileToUpload1, fileToUpload2])
          .then((result) => {
            uploadedFile1 = result.find(result => result._data === fileToUpload1);
            uploadedFile2 = result.find(result => result._data === fileToUpload2);
            const fileBasicProperties = ['_id', '_filename', 'mimeType'];
            file1Metadata = _.pick(uploadedFile1, fileBasicProperties);
            file2Metadata = _.pick(uploadedFile2, fileBasicProperties);
            query = new Kinvey.Query();
            query.equalTo('_filename', uploadedFile2._filename);
            done();
          })
          .catch(done);
      });

      describe('find()', () => {
        it('should return the metadata of all files by https', (done) => {
          Kinvey.Files.find()
            .then((result) => {
              expect(result).to.be.an('array');
              expect(result.length).to.equal(2);
              const file1 = result.find(file => file._id === uploadedFile1._id);
              const file2 = result.find(file => file._id === uploadedFile2._id);
              utilities.assertReadFileResult(file1, file1Metadata);
              utilities.assertReadFileResult(file2, file2Metadata);
              done();
            })
            .catch(done);
        });

        it('should return the metadata for all files that match the query', (done) => {
          Kinvey.Files.find(query)
            .then((result) => {
              expect(result).to.be.an('array');
              expect(result.length).to.equal(1);
              utilities.assertReadFileResult(result[0], file2Metadata);
              done();
            })
            .catch(done);
        });

        it('should return the file by http if tls = false', (done) => {
          Kinvey.Files.find(query, { tls: false })
            .then((result) => {
              utilities.assertReadFileResult(result[0], file2Metadata, true);
              done();
            })
            .catch(done);
        });

        it('should set correctly ttl', (done) => {
          const ttlValue = 1;
          Kinvey.Files.find(query, { ttl: ttlValue })
            .then((result) => {
              utilities.assertReadFileResult(result[0], file2Metadata);
              setTimeout(() => {
                return Kinvey.Files.downloadByUrl(result[0]._downloadURL)
                  .then(() => {
                    done(new Error(shouldNotBeCalledMessage));
                  })
                  .catch((error) => {
                    expect(error).to.exist;
                    // utilities.assertError(error, 'KinveyError', 'An error occurred.');
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

      describe('findById()', () => {
        it('should download the file by id', (done) => {
          Kinvey.Files.findById(uploadedFile2._id)
            .then((result) => {
              expect(result).to.equal(fileContent2);
              done();
            })
            .catch(done);
        });

        it('should return a NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
          Kinvey.Files.findById(utilities.randomString())
            .then(() => done(new Error(shouldNotBeCalledMessage)))
            .catch((error) => {
              utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
              done();
            })
            .catch(done);
        });
      });

      describe('download()', () => {
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
              utilities.assertReadFileResult(result, file1Metadata);
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
              utilities.assertReadFileResult(result, file1Metadata);
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
              utilities.assertReadFileResult(result, file1Metadata, true);
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
          Kinvey.Files.download(uploadedFile1._id, { ttl: ttlValue, stream: true })
            .then((result) => {
              utilities.assertReadFileResult(result, file1Metadata);
              setTimeout(() => {
                // TODO: change error message to 'The provided token has expired.'
                return Kinvey.Files.downloadByUrl(result._downloadURL)
                  .then(() => {
                    done(new Error(shouldNotBeCalledMessage));
                  })
                  .catch((error) => {
                    expect(error).to.exist;
                    // utilities.assertError(error, 'KinveyError', 'An error occurred.');
                    done();
                  })
                  .catch(done);
              }, ttlValue + 1000);
            })
            .catch(done);
        });

        it('should return and NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
          Kinvey.Files.download(utilities.randomString())
            .then(() => done(new Error(shouldNotBeCalledMessage)))
            .catch((error) => {
              utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
              done();
            })
            .catch(done);
        });
      });

      describe('stream()', () => {
        it('should stream the file by https when tls is not set', (done) => {
          Kinvey.Files.stream(uploadedFile1._id)
            .then((result) => {
              utilities.assertReadFileResult(result, file1Metadata);
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
              utilities.assertReadFileResult(result, file1Metadata);
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
              utilities.assertReadFileResult(result, file1Metadata, true);
              done();
            })
            .catch(done);
        });

        it('should set correctly ttl', (done) => {
          const ttlValue = 1;
          Kinvey.Files.stream(uploadedFile1._id, { ttl: ttlValue })
            .then((result) => {
              utilities.assertReadFileResult(result, file1Metadata);
              setTimeout(() => {
                // TODO: change error message to 'The provided token has expired.'
                return Kinvey.Files.downloadByUrl(result._downloadURL)
                  .then(() => {
                    done(new Error(shouldNotBeCalledMessage));
                  })
                  .catch((error) => {
                    expect(error).to.exist;
                    // utilities.assertError(error, 'KinveyError', 'An error occurred.');
                    done();
                  })
                  .catch((done));
              }, ttlValue + 1000);
            })
            .catch(done);
        });

        it('should return a NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
          Kinvey.Files.stream(utilities.randomString())
            .then(() => done(new Error(shouldNotBeCalledMessage)))
            .catch((error) => {
              utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
              done();
            })
            .catch(done);
        });
      });

      describe('downloadByUrl()', () => {
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

        it('should return an error if the url is invalid', (done) => {
          Kinvey.Files.downloadByUrl(utilities.randomString())
            .then(() => done(new Error(shouldNotBeCalledMessage)))
            .catch((error) => {
              expect(error).to.exist;
              done();
            })
            .catch(done);
        });
      });
    });

    describe('upload()', () => {
      it(`without metadata should upload with mimeType = ${octetStreamMimeType}`, (done) => {
        utilities.testFileUpload(fileToUpload1, undefined, { mimeType: octetStreamMimeType }, fileContent1, undefined, done);
      });

      it('should set custom properties, supplied with the metadata', (done) => {
        const metadata = { testProperty: 'test' };
        utilities.testFileUpload(fileToUpload1, metadata, metadata, fileContent1, undefined, done);
      });

      it('should set _acl', (done) => {
        const randomId = utilities.randomString();
        const acl = new Kinvey.Acl({});
        acl.addReader(randomId);
        const expectedArray = [randomId];
        const expectedMetadata = {};
        expectedMetadata['_acl'] = {};
        expectedMetadata['_acl']['r'] = expectedArray;
        utilities.testFileUpload(fileToUpload1, { _acl: acl.toPlainObject() }, expectedMetadata, fileContent1, undefined, done);
      });

      it('should upload a publicly-readable file with public = true', (done) => {
        utilities.testFileUpload(fileToUpload1, { public: true }, { _public: true }, fileContent1, undefined, done);
      });

      it('should update the content and the metadata of an existing file', (done) => {
        const query = new Kinvey.Query();
        const updatedmetadata = {
          filename: utilities.randomString(),
          mimeType: plainTextMimeType
        };
        const expectedMetadata = {
          _filename: updatedmetadata.filename,
          mimeType: updatedmetadata.mimeType
        };
        Kinvey.Files.upload(fileToUpload1)
          .then((file) => {
            updatedmetadata._id = file._id;
            query.equalTo('_id', updatedmetadata._id);
            utilities.testFileUpload(fileToUpload2, updatedmetadata, expectedMetadata, fileContent2, query, done)
          })
          .catch(done)
      });
    });

    describe('removeById()', () => {
      let fileToRemoveId;
      let file2Id;

      before((done) => {
        uploadFiles([fileToUpload1, fileToUpload2])
          .then((result) => {
            fileToRemoveId = result.find(result => result._data === fileToUpload1)._id;
            file2Id = result.find(result => result._data === fileToUpload2)._id;
            done();
          })
          .catch(done);
      });

      it('should remove the file by _id', (done) => {
        Kinvey.Files.removeById(fileToRemoveId)
          .then((result) => {
            expect(result.count).to.equal(1);
            // check that the file is removed
            return Kinvey.Files.findById(fileToRemoveId);
          })
          .then(() => done(new Error(shouldNotBeCalledMessage)))
          .catch((error) => {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            //check that the second file remains
            return Kinvey.Files.findById(file2Id);
          })
          .then((result) => {
            expect(result).to.equal(fileContent2);
            done();
          })
          .catch(done);
      });

      it('should return a NotFoundError if the file with the supplied _id does not exist on the server', (done) => {
        Kinvey.Files.removeById(utilities.randomString())
          .then(() => done(new Error(shouldNotBeCalledMessage)))
          .catch((error) => {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            done();
          })
          .catch(done);
      });
    });
  });
});
