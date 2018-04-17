function testFunc() {
  
    describe('Files', () => {
  
      before((done) => {
        Kinvey.User.logout()
          .then(() => Kinvey.User.signup())
          .then(() => done())
          .catch(done);
      });
  
      describe('download', () => {
        let uploadedFile;
        const fileContent = utilities.randomString();
  
        before((done) => {
          Kinvey.Files.upload(fileContent, { 'mimeType': 'text/plain' })
            .then((result) => { uploadedFile = result; })
            .then(() => done())
            .catch(done);
        });
  
        it('should download the file by _id', (done) => {
          Kinvey.Files.download(uploadedFile._id)
            .then((result) => {
              expect(result).to.exist;
              expect(result).to.equal(fileContent);
            })
            .then(() => done())
            .catch(done);
        });
      });
    });
  }
  
  runner.run(testFunc);
  