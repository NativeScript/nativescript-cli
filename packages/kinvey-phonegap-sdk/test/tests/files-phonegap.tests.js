function testFunc() {

  const plainTextMimeType = 'text/plain';
  const sampleTestFilesPath = `${cordova.file.applicationDirectory}www/sample-test-files/`;

  const ArrayBufferFromString = (str) => {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

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
    const stringContent = utilities.randomString();
    const blob = new Blob([stringContent]);
    //const arrayBuffer = ArrayBufferFromString(stringContent);
    // ArrayBuffer does not work currently - it should be discussed if we support it

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

      it('should upload a file by String content', (done) => {
        utilities.testFileUpload(stringContent, metadata, stringContent, query, done);
      });

      it('should upload a file by a Blob', (done) => {
        utilities.testFileUpload(blob, metadata, stringContent, query, done);
      });

      it('should upload a file by a Cordova File', (done) => {
        getCordovaFileEntries(sampleTestFilesPath, (fileEntries) => {
          fileEntries[0].file((cordovaFile) => {
            utilities.testFileUpload(cordovaFile, metadata, stringContent, query, done);
          });
        })
      });
    });
  });
}

runner.run(testFunc);
