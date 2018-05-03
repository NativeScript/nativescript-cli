function testFunc() {

  const fs = require('file-system');
  const plainTextMimeType = 'text/plain';

  describe('Files', () => {
    //the content should match the content of test/integration/sample-test-files/test1.txt
    const stringContent = 'some_text1';
    const filePath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files', 'test1.txt');

    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('upload()', () => {
      let metadata;
      let expectedMetadata;
      let query;

      beforeEach((done) => {
        metadata = {
          _id: utilities.randomString(),
          filename: utilities.randomString(),
          mimeType: plainTextMimeType
        };
        expectedMetadata = _.cloneDeep(metadata);
        delete expectedMetadata.filename
        expectedMetadata._filename = metadata.filename
        done();
      });

      it('should upload a file by file path', (done) => {
        utilities.testFileUpload(filePath, metadata, expectedMetadata, stringContent, null, done);
      });

      it('should upload a file by a NS File', (done) => {
        const file = fs.File.fromPath(filePath);
        utilities.testFileUpload(file, metadata, expectedMetadata, stringContent, null, done);
      });
    });
  });
}

runner.run(testFunc);
