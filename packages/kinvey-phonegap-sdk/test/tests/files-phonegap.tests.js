function testFunc() {

  const sampleTestFilesPath = `${cordova.file.applicationDirectory}www/sample-test-files/`;

  const getCordovaFileEntries = (path, callback) => {
    window.resolveLocalFileSystemURL(path,
      (fileSystem) => {
        const reader = fileSystem.createReader();
        reader.readEntries(
          (entries) => {
            callback(entries)
          },
          (err) => {
            done(err);
          }
        );
      }, (err) => {
        done(err);
      }
    );
  }

  describe('Files', () => {
    //the content should match the content of test/integration/sample-test-files/test1.txt
    const stringContent = 'some_text1';
    const blob = new Blob([stringContent]);
    const arrayBuffer = utilities.ArrayBufferFromString(stringContent);

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

      it('should upload a file by String content', (done) => {
        utilities.testFileUpload(stringContent, metadata, expectedMetadata, stringContent, null, done);
      });

      it('should upload a file by a Blob', (done) => {
        utilities.testFileUpload(blob, metadata, expectedMetadata, stringContent, null, done);
      });

      // ArrayBuffer does not work currently - it should be discussed if we support it
      it.skip('should upload a file by a ArrayBuffer', (done) => {
        utilities.testFileUpload(arrayBuffer, metadata, expectedMetadata, stringContent, null, done);
      });

      //the next test is skipped as currently the Files.upload() does not work with a Cordova File
      it.skip('should upload a file by a Cordova File', (done) => {
        getCordovaFileEntries(sampleTestFilesPath, (fileEntries) => {
          const fileEntry = fileEntries.find(entry => entry.name === 'test1.txt');
          fileEntry.file((cordovaFile) => {
            utilities.testFileUpload(cordovaFile, metadata, expectedMetadata, stringContent, null, done);
          });
        })
      });
    });
  });
}

runner.run(testFunc);
