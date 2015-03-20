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
    it('should save the version as \'foo\'', function() {
      var customVersion = 'foo';
      Kinvey.ClientAppVersion.setVersion(customVersion);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(customVersion);
    });

    it('should save the version as ' + version, function() {
      Kinvey.ClientAppVersion.setVersion(version);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(version);
    });

    it('should save the version as \'' + major + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(major);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(major + '');

      var majorString = major + '';
      Kinvey.ClientAppVersion.setVersion(majorString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(majorString);
    });

    it('should save the version as \'0.' + minor + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(0, minor);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minor);

      var minorString = minor + '';
      Kinvey.ClientAppVersion.setVersion(0, minorString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minorString);
    });

    it('should save the version as \'0.0.' + patch + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(0, 0, patch);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patch);

      var patchString = patch + '';
      Kinvey.ClientAppVersion.setVersion(0, 0,  patchString);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patchString);
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

    it('should return \'' + major + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(major);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal(major + '');
    });

    it('should return \'0.' + minor + '\'', function() {
      Kinvey.ClientAppVersion.setVersion('0', minor);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.' + minor);
    });

    it('should return \'0.0.' + patch + '\'', function() {
      Kinvey.ClientAppVersion.setVersion(0, 0, patch);
      expect(Kinvey.ClientAppVersion.stringVersion()).to.equal('0.0.' + patch);
    });
  });

  describe('clear the version', function() {
    var version = '1.2.3';

    beforeEach(function() {
      // Set the version
      Kinvey.ClientAppVersion.setVersion(version);
    });

    afterEach(function() {
      // Clear the version
      Kinvey.ClientAppVersion.clear();
    });

    it('should clear out the version', function() {
      Kinvey.ClientAppVersion.clear();
      expect(Kinvey.ClientAppVersion.stringVersion()).to.be.undefined;
    });
  });

});
