function testFunc() {

  const fs = require('file-system');

  describe('Files', () => {
    //the content should match the content of test/integration/sample-test-files/test1.txt
    const stringContent = 'some_text1';
    const filePath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files', 'test1.txt');
    const fileTestTimeoutPath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files', 'test1.png');

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('upload()', () => {
      let metadata;
      let expectedMetadata;

      beforeEach((done) => {
        metadata = utilities.getFileMetadata(utilities.randomString());
        expectedMetadata = utilities.getExpectedFileMetadata(metadata);
        done();
      });

      it('should upload a file by file path', (done) => {
        utilities.testFileUpload(filePath, metadata, expectedMetadata, stringContent, null, done);
      });

      it('should upload a file by a NS File', (done) => {
        const file = fs.File.fromPath(filePath);
        utilities.testFileUpload(file, metadata, expectedMetadata, stringContent, null, done);
      });

      it('should set options.timeout', (done) => {
        Kinvey.Files.upload(fileTestTimeoutPath, undefined, { timeout: 100 })
          .then(() => done(new Error('Should not be called')))
          .catch((error) => {
            // Currently the error message is different for Android and iOS
            const isErrorMessageCorrect = _.includes(error.message, 'request timed out') || _.includes(error.message, 'SocketTimeoutException');
            expect(isErrorMessageCorrect).to.be.true;
            done();
          })
          .catch(done)
      })
    });
  });
}

runner.run(testFunc);
