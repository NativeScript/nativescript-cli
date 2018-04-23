function testFunc() {

  const notFoundErrorName = 'NotFoundError';
  const notFoundErrorMessage = 'This blob not found for this app backend';
  const plainTextMimeType = 'text/plain';
  const shouldNotBeCalledMessage = 'Should not be called';

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

      it.skip('should upload a file by string content', (done) => {
        debugger
        const stringContent = utilities.randomString();
        Kinvey.Files.upload(stringContent, metadata)
          .then((result) => {
            utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, stringContent)
            done();
          })
          .catch(done);
      });
    });
  });
}

runner.run(testFunc);
