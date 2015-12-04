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

const File = require('../../src/legacy/file');
const BlobNotFoundError = require('../../src/core/errors').BlobNotFoundError;
const nock = require('nock');
const fs = require('fs');
const path = require('path');
const url = require('url');
const qs = require('qs');
const clone = require('lodash/lang/clone');
const filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';

describe('File', function() {
  before(function() {
    return Common.loginUser().then(user => {
      this.user = user;
    });
  });

  after(function() {// Reset.
    return Common.logoutUser();
  });

  after(function() {
    delete this.user;
  });

  before(function(done) {
    const filename = 'test.png';
    fs.readFile(path.normalize(path.join(__dirname, '..', 'fixtures', filename)), (err, data) => {
      if (err) {
        return done(err);
      }

      this.file = {
        _id: Common.randomString(24),
        _filename: filename,
        size: data.length,
        _data: data,
        mimeType: 'image/png',
        _acl: {
          creator: this.user._id
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      };

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      this.file._expiresAt = expiresAt.toISOString();

      done();
    });
  });

  after(function() {
    delete this.file;
  });

  before(function() {
    this.ttl = 365 * 24 * 60 * 60; // One year.
    this.ttlRange = 30; // Max difference between server and client expiresAt.
  });

  beforeEach(function() {
    this.expiresAt = parseInt(new Date(this.file._expiresAt) / 1000, 10) + this.ttl;
  });

  after(function() {
    delete this.ttl;
    delete this.expiresAt;
    delete this.ttlRange;
  });

  describe('destroy()', function() {
    beforeEach(function() {
      const reply = clone(this.file);
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 30);
      reply._expiresAt = expiresAt.toISOString();
      reply._uploadURL = 'http://storage.googleapis.com/d2d53e8f99b64980ae43fd80a2bda953/767ca4c8-faf3-4c42-bad7-a25505257f78/ec37de0b-5aee-4d97-97e6-df938697b4de?GoogleAccessId=558440376631@developer.gserviceaccount.com&Expires=1449160465&Signature=Dw8SwoZwhVcvZ%2Fuwz5z8TIZYrOxzj9SPxbvNxk5FZcZlJ6R7ADgHCz3m7hAnfmMFWSAxMm02H7QfNRhDRH5DH2UR5F3SQMDzTEZKzg5uUhDdc6hCE4nWyq4F5Zu6Lct0bgbPn5BZcpkbtG%2B%2Bf3l7yQeSJJdkLU0DLBVapewWVt8%3D';
      reply._requiredHeaders = {};

      nock(this.client.apiUrl)
        .post(`/${filesNamespace}/${this.client.appId}`)
        .reply(201, reply, {
          'content-type': 'application/json'
        });

      const uploadUrlParts = url.parse(reply._uploadURL);
      nock(`${uploadUrlParts.protocol}//${uploadUrlParts.hostname}`)
        .put(uploadUrlParts.pathname)
        .query(qs.parse(uploadUrlParts.query))
        .reply(200);

      return File.upload(this.file._data).then(response => {
        this.metadata = response;
      });
    });

    afterEach(function() {
      const reply = {
        count: 1
      };

      nock(this.client.apiUrl)
        .delete(`/${filesNamespace}/${this.client.appId}/${this.metadata._id}`)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return File.destroy(this.metadata._id, { silent: true });
    });

    afterEach(function() {
      delete this.metadata;
    });

    it('should delete a file', function() {
      const reply = {
        count: 1
      };

      nock(this.client.apiUrl)
        .delete(`/${filesNamespace}/${this.client.appId}/${this.metadata._id}`)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      const promise = File.destroy(this.metadata._id);
      return expect(promise).to.eventually.have.property('count', 1);
    });

    it('should fail when the file does not exist', function() {
      const id = Common.randomString(24);
      const reply = {
        name: 'BlobNotFound'
      };

      nock(this.client.apiUrl)
        .delete(`/${filesNamespace}/${this.client.appId}/${id}`)
        .reply(404, reply, {
          'content-type': 'application/json'
        });

      const promise = File.destroy(id);
      return promise.then(function() {
        return expect(promise).to.be.rejected;
      }).catch(err => {
        expect(err).to.be.instanceof(BlobNotFoundError);
      });
    });

    it('should succeed when the file does not exist and the `silent` flag was set.', function() {
      const id = Common.randomString(24);
      const reply = {
        name: 'BlobNotFound',
        description: 'The blob was not found.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .delete(`/${filesNamespace}/${this.client.appId}/${id}`)
        .reply(404, reply, {
          'content-type': 'application/json'
        });

      const promise = File.destroy(id, { silent: true });
      return expect(promise).to.eventually.have.property('count', 0);
    });

    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      const reply = {
        count: 1
      };

      nock(this.client.apiUrl)
        .delete(`/${filesNamespace}/${this.client.appId}/${this.metadata._id}`)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return File.destroy(this.metadata._id, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      return File.destroy(Common.randomString(), options);
    }));
  });

  describe('download()', function() {
    it('should download a file', function() {
      const reply = clone(this.file);
      reply._downloadURL = 'https://storage.googleapis.com/d2d53e8f99b64980ae43fd80a2bda953/53287e66-93ad-41ac-b8b3-901a04ef6639/2c10f5b0-4367-4ed1-bd5d-98cd78691bbe';

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${this.file._id}`)
        .query({ tls: true })
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      const promise = File.download(this.file._id);
      return promise.then(response => {
        expect(response).to.contain.keys(['_id', '_downloadURL', 'mimeType', 'size']);
        expect(response.size).to.equal(this.file.size);
        expect(response.mimeType).to.equal(this.file.mimeType);
      });
    });

    it('should return a _downloadURL over TLS by default', function() {
      const reply = clone(this.file);
      reply._downloadURL = 'https://storage.googleapis.com/d2d53e8f99b64980ae43fd80a2bda953/53287e66-93ad-41ac-b8b3-901a04ef6639/2c10f5b0-4367-4ed1-bd5d-98cd78691bbe';

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${this.file._id}`)
        .query({ tls: true })
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      const promise = File.download(this.file._id);
      return promise.then(response => {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^https\:\/\//);
      });
    });

    it('should return an unsafe _downloadURL if `options.tls` was set to false', function() {
      const reply = clone(this.file);
      reply._downloadURL = 'http://storage.googleapis.com/d2d53e8f99b64980ae43fd80a2bda953/53287e66-93ad-41ac-b8b3-901a04ef6639/2c10f5b0-4367-4ed1-bd5d-98cd78691bbe';

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${this.file._id}`)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      const promise = File.download(this.file._id, { tls: false });
      return promise.then(response => {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^http\:\/\//);
      });
    });

    it('should fail when the file does not exist', function() {
      const id = Common.randomString(24);
      const reply = {
        name: 'BlobNotFound',
        description: 'The blob was not found.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${id}`)
        .query({ tls: true })
        .reply(404, reply, {
          'content-type': 'application/json'
        });

      const promise = File.download(id);
      return promise.then(() => {
        return expect(promise).to.be.rejected;
      }).catch(err => {
        expect(err).to.be.instanceof(BlobNotFoundError);
      });
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      const reply = clone(this.file);
      reply._downloadURL = 'https://storage.googleapis.com/d2d53e8f99b64980ae43fd80a2bda953/53287e66-93ad-41ac-b8b3-901a04ef6639/2c10f5b0-4367-4ed1-bd5d-98cd78691bbe';

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${this.file._id}`)
        .query({ tls: true })
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return File.download(this.file._id, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      const id = Common.randomString(24);
      const reply = {
        name: 'BlobNotFound',
        description: 'The blob was not found.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .get(`/${filesNamespace}/${this.client.appId}/${id}`)
        .query({ tls: true })
        .reply(404, reply, {
          'content-type': 'application/json'
        });

      return File.download(id, options);
    }));
  });

/*
  // Kinvey.File.downloadByUrl.
  describe('the downloadByUrl method', function() {
    // Test suite.
    it('should download a file by URL.', function() {
      var promise = Kinvey.File.downloadByUrl(this.file._downloadURL);
      return expect(promise).to.eventually.have.property('_data');
    });
    it('should download a file by metadata.', function() {
      var promise = Kinvey.File.downloadByUrl(this.file);
      return expect(promise).to.eventually.have.property('_data');
    });
    it('should succeeed with additional request headers.', function() {
      var headers = { 'If-None-Match': '*' };
      var promise = Kinvey.File.downloadByUrl(this.file, { headers: headers });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail with additional request headers.', function() {
      var headers = { 'If-Match': '*' };
      var promise = Kinvey.File.downloadByUrl(this.file, { headers: headers });
      return promise.then(function() {
        // We should not reach this code branch.
        expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.REQUEST_ERROR);
        expect(error).to.have.property('debug');
        expect(error.debug).to.be.a('string');
        expect(error.debug).to.contain('PreconditionFailed');
      });
    });
    it('should fail when the URL is unreachable.', function() {
      var promise = Kinvey.File.downloadByUrl(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.REQUEST_ERROR);
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.downloadByUrl(this.file, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.File.downloadByUrl(this.randomID(), options);
    }));
  });

  // Kinvey.File.find.
  describe('the find method', function() {
    // Housekeeping: restore credentials.
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;
    });

    // Housekeeping: upload two files.
    before(function() {
      var _this = this;
      return Kinvey.Defer.all([
        Kinvey.File.upload(this.file._data),
        Kinvey.File.upload(this.file._data)
      ]).then(function(response) {
        _this.file1 = response[0];
        _this.file2 = response[1];
      });
    });
    after(function() {// Delete the created files.
      return Kinvey.Defer.all([
        Kinvey.File.destroy(this.file1._id),
        Kinvey.File.destroy(this.file2._id)
      ]);
    });
    after(function() {// Cleanup.
      delete this.file1;
      delete this.file2;
    });

    // Housekeeping: create an empty query.
    beforeEach(function() {
      this.query = new Kinvey.Query();
    });
    afterEach(function() {// Cleanup.
      delete this.query;
    });

    // Test suite.
    it('should return all files.', function() {
      var promise = Kinvey.File.find();
      return expect(promise).to.eventually.have.length.of.at.least(2);
    });
    it('should return all files, with filter:_filename', function() {
      this.query.equalTo('_filename', this.file1._filename);

      var _this   = this;
      var promise = Kinvey.File.find(this.query);
      return promise.then(function(files) {
        expect(files).to.have.length(1);
        expect(files[0]).to.have.property('_filename', _this.file1._filename);
      });
    });
    it('should return all files, with sort:_filename.', function() {
      this.query.ascending('_filename');
      var promise = Kinvey.File.find(this.query);
      return promise.then(function(files) {
        expect(files).to.be.an('array');
        expect(files).to.have.length.of.at.least(2);

        // Inspect array.
        for(var i = 1, j = files.length; i < j; i += 1) {
          expect(files[i - 1]._filename).to.be.lessThan(files[i]._filename);
        }
      });
    });
    it('should return all files, with limit.', function() {
      this.query.limit(1);
      var promise = Kinvey.File.find(this.query);
      return expect(promise).to.eventually.have.length(1);
    });
    it('should return all files, with skip.', function() {
      this.query.skip(1);
      var promise = Kinvey.File.find(this.query);
      return expect(promise).to.eventually.have.length.of.at.least(1);
    });
    it('should return a _downloadURL over TLS by default.', function() {
      var promise = Kinvey.File.find();
      return promise.then(function(files) {
        expect(files).to.be.an('array');

        // Inspect array.
        for(var i = 0, j = files.length; i < j; i += 1) {
          expect(files[i]).to.have.property('_downloadURL');
          expect(files[i]._downloadURL).to.match(/^https\:\/\//);
        }
      });
    });
    it('should return an unsafe _downloadURL if `options.tls` was set to false.', function() {
      var promise = Kinvey.File.find(null, { tls: false });
      return promise.then(function(files) {
        expect(files).to.be.an('array');

        // Inspect array.
        for(var i = 0, j = files.length; i < j; i += 1) {
          expect(files[i]).to.have.property('_downloadURL');
          expect(files[i]._downloadURL).to.match(/^http\:\/\//);
        }
      });
    });
    it('should support the ttl option.', function() {
      var _this   = this;
      var promise  = Kinvey.File.find(null, { ttl: this.ttl });
      return promise.then(function(files) {
        expect(files).to.be.an('array');

        // Inspect array.
        for(var i = 0, j = files.length; i < j; i += 1) {
          expect(files[i]).to.have.property('_expiresAt');

          // Check range.
          var ttl = parseInt(new Date(files[i]._expiresAt).getTime() / 1000, 10);
          expect(ttl).to.be.closeTo(_this.expiresAt, _this.ttlRange);
        }
      });
    });
    it('should download the actual file resource if the download flag was set.', function() {
      var promise = Kinvey.File.find(null, { download: true });
      return promise.then(function(files) {
        // Inspect array.
        for(var i = 0, j = files.length; i < j; i += 1) {
          expect(files[i]).to.have.property('_data');
        }
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.find(null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.File.find(null, options);
    }));
  });

  // Kinvey.File.stream.
  describe('the stream method', function() {
    // Test suite.
    it('should return the download URL.', function() {
      var promise = Kinvey.File.stream(this.file._id);
      return expect(promise).not.to.eventually.have.property('_data');
    });
    it('should return a _downloadURL over TLS by default.', function() {
      var promise = Kinvey.File.stream(this.file._id);
      return promise.then(function(response) {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^https\:\/\//);
      });
    });
    it('should return an unsafe _downloadURL if `options.tls` was set to false.', function() {
      var promise = Kinvey.File.stream(this.file._id, { tls: false });
      return promise.then(function(response) {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^http\:\/\//);
      });
    });
    it('should support the ttl option.', function() {
      var _this    = this;
      var promise  = Kinvey.File.stream(this.file._id, { ttl: this.ttl });
      return promise.then(function(response) {
        expect(response).to.have.property('_expiresAt');

        // Check range.
        var ttl = parseInt(new Date(response._expiresAt).getTime() / 1000, 10);
        expect(ttl).to.be.closeTo(_this.expiresAt, _this.ttlRange);
      });
    });
    it('should fail when the file does not exist.', function() {
      var promise = Kinvey.File.stream(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.BLOB_NOT_FOUND);
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.stream(this.file._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.File.stream(this.randomID(), options);
    }));
  });

  // Kinvey.File.upload.
  describe('the upload method', function() {
    // Housekeeping: restore credentials.
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;
    });

    // Housekeeping: delete any uploaded files.
    afterEach(function() {
      var query = new Kinvey.Query().equalTo('_acl.creator', Kinvey.getActiveUser()._id);
      return Kinvey.File.find(query).then(function(files) {
        var promises = files.map(function(file) {
          return Kinvey.File.destroy(file._id);
        });
        return Kinvey.Defer.all(promises);
      });
    });

    // Test suite.
    it('should upload a file.', function() {
      var promise = Kinvey.File.upload(this.file._data);
      return promise.then(function(response) {
        expect(response).to.contain.keys(['_id', '_data', '_filename']);
        expect(response).not.to.have.property('_uploadURL');
      });
    });
    it('should upload a file with predefined _id.', function() {
      var id      = this.randomID();
      var promise = Kinvey.File.upload(this.file._data, { _id: id });
      return expect(promise).eventually.to.have.property('_id', id);
    });
    it('should upload a file with predefined data.', function() {
      var data    = { _filename: this.randomID(), field: this.randomID() };
      var promise = Kinvey.File.upload(this.file._data, data);
      return promise.then(function(response) {
        expect(response).to.have.property('_filename', data._filename);
        expect(response).to.have.property('field', data.field);
      });
    });
    it('should upload a publicly-readable file if the public flag was set.', function() {
      var promise = Kinvey.File.upload(this.file._data, null, { public: true });
      return expect(promise).to.eventually.have.property('_public', true);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.upload(this.file._data, null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.File.upload(this.file._data, null, options);
    }));
  });
*/
});
