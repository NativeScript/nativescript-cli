import { expect } from 'chai';
// eslint-disable-next-line import/extensions
import * as Kinvey from '__SDK__';
import * as utilities from '../../shared/utils';

describe('Files', () => {
  const stringContent = utilities.randomString();
  const blob = new Blob([stringContent]);
  const file = new File([stringContent], utilities.randomString());
  const fileRepresentations = [stringContent, blob, file];
  // const arrayBuffer = utilities.ArrayBufferFromString(stringContent);
  // ArrayBuffer does not work currently - it should be discussed if we support it

  before(() => {
    return Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

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

    it('should set options.timeout', (done) => {
      Kinvey.Files.upload(stringContent, undefined, { timeout: 1 })
        .then(() => done(new Error('Should not be called')))
        .catch((error) => {
          expect(error.message).to.contain('request timed out');
          done();
        })
        .catch(done);
    });
  });
});
