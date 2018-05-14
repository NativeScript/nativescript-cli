function testFunc() {

  describe('Files', () => {
    const stringContent = utilities.randomString();
    const blob = new Blob([stringContent]);
    const file = new File([stringContent], utilities.randomString());
    const fileRepresentations = [stringContent, blob, file];
    //const arrayBuffer = utilities.ArrayBufferFromString(stringContent);
    // ArrayBuffer does not work currently - it should be discussed if we support it

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

      fileRepresentations.forEach((representation) => {
        it(`should upload a file by ${representation.constructor.name}`, (done) => {
          utilities.testFileUpload(representation, metadata, expectedMetadata, stringContent, null, done);
        });
      });
    });
  });
}

runner.run(testFunc);
