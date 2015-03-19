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

  describe('set the version', function() {
    var version = '1.2.3',
        major = 1,
        minor = 2,
        patch = 3;

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    // Test suite.
    it('should save the version', function() {
      var customVersion = 'foo';
      Kinvey.ClientAppVersion.setVersion(customVersion);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(customVersion);
    });

    it('should save the version and set semver values if version uses the semver format', function() {
      Kinvey.ClientAppVersion.setVersion(version);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(version);
    });

    it('should save the major version ' + major, function() {
      Kinvey.ClientAppVersion.setMajorVersion(major);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(major + '.0.0');
    });
    it('should save the major version \'' + major + '\'', function() {
      var majorString = major + '';
      Kinvey.ClientAppVersion.setMajorVersion(majorString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(majorString + '.0.0');
    });
    it('should throw an error if trying to set major version to something that is not a number', function() {
      var invalidMajor = 'foo';
      expect(function() {
        Kinvey.ClientAppVersion.setMajorVersion(invalidMajor);
      }).to.Throw();
    });

    it('should save the minor version ' + minor, function() {
      Kinvey.ClientAppVersion.setMinorVersion(minor);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minor + '.0');
    });
    it('should save the minor version \'' + minor + '\'', function() {
      var minorString = minor + '';
      Kinvey.ClientAppVersion.setMinorVersion(minorString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minorString + '.0');
    });
    it('should throw an error if trying to set minor version to something that is not a number', function() {
      var invalidMinor = 'foo';
      expect(function() {
        Kinvey.ClientAppVersion.setMinorVersion(invalidMinor);
      }).to.Throw();
    });

    it('should save the patch version ' + patch, function() {
      Kinvey.ClientAppVersion.setPatchVersion(patch);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patch);
    });
    it('should save the patch version \'' + patch + '\'', function() {
      var patchString = patch + '';
      Kinvey.ClientAppVersion.setPatchVersion(patchString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patchString);
    });
    it('should throw an error if trying to set patch version to something that is not a number', function() {
      var invalidPatch = 'foo';
      expect(function() {
        Kinvey.ClientAppVersion.setPatchVersion(invalidPatch);
      }).to.Throw();
    });
  });

  describe('string of the version', function() {
    var version = '1.2.3',
        major = 1,
        minor = 2,
        patch = 3;

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    it('should return \'' + version + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(version);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(version);
    });

    it('should return \'' + major + '.0.0\'', function() {
      Kinvey.ClientAppVersion.setMajorVersion(major);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(major + '.0.0');
    });

    it('should return \'0.' + minor + '.0\'', function() {
      Kinvey.ClientAppVersion.setMinorVersion(minor);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minor + '.0');
    });

    it('should return \'0.0.' + patch + '\'', function() {
      Kinvey.ClientAppVersion.setPatchVersion(patch);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patch);
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
      expect(Kinvey.ClientAppVersion.stringVersion()).to.be.undefined;
      expect(Kinvey.ClientAppVersion.majorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.minorVersion()).to.deep.equal(NaN);
      expect(Kinvey.ClientAppVersion.patchVersion()).to.deep.equal(NaN);
    });
  });

});
