function testFunc() {

  const notFoundErrorName = 'NotFoundError';
  const notFoundErrorMessage = 'This blob not found for this app backend';
  const plainTextMimeType = 'text/plain';
  const shouldNotBeCalledMessage = 'Should not be called';

  const ArrayBufferFromString = (str) => {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  describe('Files', () => {

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('upload()', () => {
      let metadata;
      let query

      beforeEach((done) => {
        metadata = {
          _id: utilities.randomString(),
          filename: utilities.randomString(),
          mimeType: plainTextMimeType
        };
        query = new Kinvey.Query();
        query.equalTo('_filename', metadata.filename);
        done();
      });

      it('should upload a file by string content', (done) => {
        const stringContent = utilities.randomString();
        Kinvey.Files.upload(stringContent, metadata)
          .then((result) => {
            utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, stringContent)
            return Kinvey.Files.find(query);
          })
          .then((result) => {
            const fileMetadata = result[0];
            utilities.assertReadFileResult(fileMetadata, metadata._id, metadata.mimeType, metadata.filename);
            return Kinvey.Files.downloadByUrl(fileMetadata._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(stringContent);
            done();
          })
          .catch(done);
      });

      it('should upload a Blob', (done) => {
        const stringContent = utilities.randomString();
        const fileAsBlob = new Blob([stringContent]);
        Kinvey.Files.upload(fileAsBlob, metadata)
          .then((result) => {
            utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, fileAsBlob)
            return Kinvey.Files.find(query);
          })
          .then((result) => {
            const fileMetadata = result[0];
            utilities.assertReadFileResult(fileMetadata, metadata._id, metadata.mimeType, metadata.filename);
            return Kinvey.Files.downloadByUrl(fileMetadata._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(stringContent);
            done();
          })
          .catch(done);
      });

      it('should upload a File', (done) => {
        const stringContent = utilities.randomString();
        const fileAsBlob = new Blob([stringContent]);
        const file = new File([fileAsBlob], metadata.filename, { type: 'text/plain', lastModified: Date.now() })
        Kinvey.Files.upload(file, metadata)
          .then((result) => {
            utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, file)
            return Kinvey.Files.find(query);
          })
          .then((result) => {
            const fileMetadata = result[0];
            utilities.assertReadFileResult(fileMetadata, metadata._id, metadata.mimeType, metadata.filename);
            return Kinvey.Files.downloadByUrl(fileMetadata._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(stringContent);
            done();
          })
          .catch(done);
      });

      it.skip('should upload an ArrayBuffer', (done) => {
        const stringContent = utilities.randomString();
        const arrayBuffer = ArrayBufferFromString(stringContent);
        Kinvey.Files.upload(arrayBuffer, metadata)
          .then((result) => {
            utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, arrayBuffer)
            return Kinvey.Files.find(query);
          })
          .then((result) => {
            const fileMetadata = result[0];
            utilities.assertReadFileResult(fileMetadata, metadata._id, metadata.mimeType, metadata.filename);
            return Kinvey.Files.downloadByUrl(fileMetadata._downloadURL);
          })
          .then((result) => {
            expect(result).to.exist;
            expect(result).to.equal(stringContent);
            done();
          })
          .catch(done);
      });
    });
  });
}

runner.run(testFunc);
