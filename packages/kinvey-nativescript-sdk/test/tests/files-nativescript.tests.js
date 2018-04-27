function testFunc() {

  const fs = require('file-system');
  const plainTextMimeType = 'text/plain';

  describe('Files', () => {
    //the content should match the content of test/integration/sample-test-files/test1.txt
    const stringContent = 'some_text';
    const filePath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files', 'test1.txt');
    console.log(filePath);
    before((done) => {
      Kinvey.User.logout()
        .then(() => Kinvey.User.signup())
        .then(() => done())
        .catch(done);
    });

    describe('upload()', () => {
      let metadata;
      let query;

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

      //skipped until MLIBZ-2452 is fixed
      it.skip('should upload a file by file path', (done) => {
        utilities.testFileUpload(filePath, metadata, stringContent, query, done);
      });

      //skipped until MLIBZ-2452 is fixed
      it.skip('should upload a file by a NS File', (done) => {
        const file = fs.File.fromPath(filePath);
        utilities.testFileUpload(file, metadata, stringContent, query, done);
      });
    });
  });
}

runner.run(testFunc);
