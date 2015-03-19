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

// Client App Version
// ----

// Set app version for the application.

(function(root) {
  var appVersion = {
    semver: undefined,
    version: undefined,
    major: undefined,
    minor: undefined,
    patch: undefined,
    release: undefined,
    build: undefined
  };
  var semverRegex = /^v?((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/;

  var parseVersion = function(version) {
    var m = [undefined, version];

    // If the version is a string, try and parse the values
    if (isString(version)) {
      version.trim();
      m = semverRegex.exec(version) || m;
    } else {
      // If version is an object, set the individual values
      if (version.hasOwnProperty('semver')) {
        m[0] = (version.semver + '').trim();
      }
      if (version.hasOwnProperty('version')) {
        m[1] = (version.version + '').trim();
      }
      if (version.hasOwnProperty('major') && isNumber(version.major)) {
        m[2] = (version.major + '').trim();
      }
      if (version.hasOwnProperty('minor') && isNumber(version.minor)) {
        m[3] = (version.minor + '').trim();
      }
      if (version.hasOwnProperty('patch') && isNumber(version.patch)) {
        m[4] = (version.patch + '').trim();
      }
      if (version.hasOwnProperty('release')) {
        m[5] = (version.release + '').trim();
      }
      if (version.hasOwnProperty('build')) {
        m[6] = (version.build + '').trim();
      }
    }

    // Reset the app version
    resetAppVersion();

    // Set the values for the app version
    appVersion = {
      semver: m[0],
      version: m[1],
      major: m[2],
      minor: m[3],
      patch: m[4],
      release: m[5],
      build: m[6]
    };

    return appVersion;
  };

  var stringifyAppVersion = function(version) {
    var str = '';

    // If the version isn't semver style then just
    // use the version
    if (null != version.version && null == semverRegex.exec(version.version)) {
      str = version.version;
    } else {
      // Build the string from the version pieces
      str += version.major || '0';
      str += '.';
      str += version.minor || '0';
      str += '.';
      str += version.patch || '0';

      if (null != version.release) {
        str += '-' + version.release;
      }
      if (null != version.build) {
        str += '+' + version.build;
      }
    }

    return str;
  };

  var resetAppVersion = function() {
    appVersion = {
      semver: undefined,
      version: undefined,
      major: undefined,
      minor: undefined,
      patch: undefined,
      release: undefined,
      build: undefined
    };

    return appVersion;
  };

  root.ClientAppVersion = {

    semver: function() {
      return appVersion.semver;
    },

    version: function() {
      return appVersion.version;
    },

    majorVersion: function() {
      return parseInt(appVersion.major);
    },

    minorVersion: function() {
      return parseInt(appVersion.minor);
    },

    patchVersion: function() {
      return parseInt(appVersion.patch);
    },

    releaseVersion: function() {
      return appVersion.release;
    },

    buildVersion: function() {
      return appVersion.build;
    },

    setVersion: function(version) {
      parseVersion(version);
    },

    setMajorVersion: function(major) {
      major = isEmptyString(major) || isNaN(major) ? major : parseInt(major);

      if (!isNumber(major)) {
        throw new Kinvey.Error('Major version must be a number.');
      }

      appVersion.major = (major + '').trim();
    },

    setMinorVersion: function(minor) {
      minor = isEmptyString(minor) || isNaN(minor) ? minor : parseInt(minor);

      if (!isNumber(minor)) {
        throw new Kinvey.Error('Minor version must be a number.');
      }

      appVersion.minor = (minor + '').trim();
    },

    setPatchVersion: function(patch) {
      patch = isEmptyString(patch) || isNaN(patch) ? patch : parseInt(patch);

      if (!isNumber(patch)) {
        throw new Kinvey.Error(patch + ' + is not a valid patch version. ' +
                               'Patch version must be a number. ');
      }

      appVersion.patch = (patch + '').trim();
    },

    setReleaseVersion: function(release) {
      appVersion.release = (release + '').trim();
    },

    setBuildVersion: function(build) {
      appVersion.build = (build + '').trim();
    },

    toString: function() {
      return stringifyAppVersion(appVersion);
    },

    clear: function() {
      resetAppVersion();
    }
  };

  return root.ClientAppVersion;
})(Kinvey || {});

