/**
 * Copyright 2015 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Test suite for `ClientAppVersion`.
 */
describe('Kinvey.ClientAppVersion', function() {
  after(function() {
    // Clear the version
    Kinvey.ClientAppVersion.clear();
  });

  describe('get the version', function() {
    var semver = '1.2.3',
        version = '1.2.3',
        major = 1,
        minor = 2,
        patch = 3;

    beforeEach(function() {
      // Set the version
      Kinvey.ClientAppVersion.setVersion(semver);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    it('should return \'foo\' for the version', function() {
      var version = 'foo';
      Kinvey.ClientAppVersion.setVersion(version);

      expect(Kinvey.ClientAppVersion.semver()).to.be.undefined;
      expect(Kinvey.ClientAppVersion.version()).to.equal(version);
      expect(Kinvey.ClientAppVersion.majorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.deep.equal(NaN);
    });

    it('should return \'' + semver + '\' for the semver', function() {
      expect(Kinvey.ClientAppVersion.semver()).to.equal(semver);
    });

    it('should return \'' + version + '\' for the version', function() {
      expect(Kinvey.ClientAppVersion.version()).to.equal(version);
    });

    it('should return ' + major + ' for the major version', function() {
      expect(Kinvey.ClientAppVersion.majorVersion()).to.equal(major);
    });

    it('should return ' + minor + ' for the minor version', function() {
      expect(Kinvey.ClientAppVersion.minorVersion()).to.equal(minor);
    });

    it('should return ' + patch + ' for the patch version', function() {
      expect(Kinvey.ClientAppVersion.patchVersion()).to.equal(patch);
    });
  });

  describe('set the version', function() {
    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    // Test suite.
    it('should save the version', function() {
      var version = 'foo';
      Kinvey.ClientAppVersion.setVersion(version);
      expect(Kinvey.ClientAppVersion.version()).to.equal(version);
      expect(Kinvey.ClientAppVersion.toString()).to.equal(version);
    });

    it('should save the version and set semver values if version uses the semver format', function() {
      var semver = '1.2.3-x.7.z.92+exp.sha.5114f85',
          version = '1.2.3',
          major = 1,
          minor = 2,
          patch = 3,
          release = 'x.7.z.92',
          build = 'exp.sha.5114f85';

      Kinvey.ClientAppVersion.setVersion(semver);
      expect(Kinvey.ClientAppVersion.semver()).to.equal(semver);
      expect(Kinvey.ClientAppVersion.version()).to.equal(version);
      expect(Kinvey.ClientAppVersion.majorVersion()).to.equal(major);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.equal(minor);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.equal(patch);
      expect(Kinvey.ClientAppVersion.releaseVersion()).to.equal(release);
      expect(Kinvey.ClientAppVersion.buildVersion()).to.equal(build);
      expect(Kinvey.ClientAppVersion.toString()).to.equal(semver);
    });

    it('should save the major version 1', function() {
      var majorVersion = 1;

      Kinvey.ClientAppVersion.setMajorVersion(majorVersion);
      expect(Kinvey.ClientAppVersion.majorVersion()).to.equal(majorVersion);
    });
    it('should save the major version \'1\'', function() {
      var majorVersion = '1';

      Kinvey.ClientAppVersion.setMajorVersion(majorVersion);
      expect(Kinvey.ClientAppVersion.majorVersion()).to.equal(parseInt(majorVersion));
    });
    it('should throw an error if trying to set major version to something that is not a number', function() {
      var majorVersion = 'foo';

      expect(function() {
        Kinvey.ClientAppVersion.setMajorVersion(majorVersion);
      }).to.Throw();
    });

    it('should save the minor version 2', function() {
      var minorVersion = 2;

      Kinvey.ClientAppVersion.setMinorVersion(minorVersion);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.equal(minorVersion);
    });
    it('should save the minor version \'2\'', function() {
      var minorVersion = '2';

      Kinvey.ClientAppVersion.setMinorVersion(minorVersion);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.equal(parseInt(minorVersion));
    });
    it('should throw an error if trying to set minor version to something that is not a number', function() {
      var minorVersion = 'foo';

      expect(function() {
        Kinvey.ClientAppVersion.setMinorVersion(minorVersion);
      }).to.Throw();
    });

    it('should save the patch version 3', function() {
      var patchVersion = 3;

      Kinvey.ClientAppVersion.setPatchVersion(patchVersion);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.equal(patchVersion);
    });
    it('should save the patch version \'3\'', function() {
      var patchVersion = '3';

      Kinvey.ClientAppVersion.setPatchVersion(patchVersion);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.equal(parseInt(patchVersion));
    });
    it('should throw an error if trying to set patch version to something that is not a number', function() {
      var patchVersion = 'foo';

      expect(function() {
        Kinvey.ClientAppVersion.setPatchVersion(patchVersion);
      }).to.Throw();
    });

    it('should save the release version', function() {
      var releaseVersion = 'beta';

      Kinvey.ClientAppVersion.setReleaseVersion(releaseVersion);
      expect(Kinvey.ClientAppVersion.releaseVersion()).to.equal(releaseVersion);
    });

    it('should save the build version', function() {
      var buildVersion = '1234';

      Kinvey.ClientAppVersion.setBuildVersion(buildVersion);
      expect(Kinvey.ClientAppVersion.buildVersion()).to.equal(buildVersion);
    });
  });

  describe('string of the version', function() {
    var semver = '1.2.3',
        version = '1.2.3',
        major = 1,
        minor = 2,
        patch = 3;

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    it('should return \'' + semver + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(semver);
      expect(Kinvey.ClientAppVersion.toString()).to.equal(semver);
    });

    it('should return \'' + version + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(version);
      expect(Kinvey.ClientAppVersion.toString()).to.equal(version);
    });

    it('should return \'' + major + '.0.0\'', function() {
      Kinvey.ClientAppVersion.setMajorVersion(major);
      expect(Kinvey.ClientAppVersion.toString()).to.equal(major + '.0.0');
    });

    it('should return \'0.' + minor + '.0\'', function() {
      Kinvey.ClientAppVersion.setMinorVersion(minor);
      expect(Kinvey.ClientAppVersion.toString()).to.equal('0.' + minor + '.0');
    });

    it('should return \'0.0.' + patch + '\'', function() {
      Kinvey.ClientAppVersion.setPatchVersion(patch);
      expect(Kinvey.ClientAppVersion.toString()).to.equal('0.0.' + patch);
    });
  });

  describe('clear the version', function() {
    var semver = '1.2.3';

    beforeEach(function() {
      // Set the version
      Kinvey.ClientAppVersion.setVersion(semver);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    it('should clear out the version', function() {
      Kinvey.ClientAppVersion.clear();
      expect(Kinvey.ClientAppVersion.semver()).to.be.undefined;
      expect(Kinvey.ClientAppVersion.version()).to.be.undefined;
      expect(Kinvey.ClientAppVersion.majorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.deep.equal(NaN);
    });
  });

});
