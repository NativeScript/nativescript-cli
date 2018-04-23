function testFunc() {

  const plainTextMimeType = 'text/plain';

  const ArrayBufferFromString = (str) => {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  describe('Files', () => {
    const stringContent = utilities.randomString();
    const blob = new Blob([stringContent]);
    const file = new File([stringContent], utilities.randomString());
    const fileRepresentations = [stringContent, blob, file];
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

      fileRepresentations.forEach((representation) => {
        it(`should upload a file by ${representation.constructor.name}`, (done) => {
          Kinvey.Files.upload(representation, metadata)
            .then((result) => {
              utilities.assertFileUploadResult(result, metadata._id, metadata.mimeType, metadata.filename, representation)
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
  });
}

runner.run(testFunc);
