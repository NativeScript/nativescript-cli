/**
 * Test suite for `Kinvey.File`.
 */
describe('Kinvey.File', function() {

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: preseed a file.
  before(function() {
    var _this = this;
    var query = new Kinvey.Query().equalTo('_filename', 'test.png').limit(1);
    return Kinvey.File.find(query, { download: true }).then(function(files) {
      expect(files).to.have.length(1);// Make sure the file is really there.
      _this.file = files[0];
    });
  });
  after(function() {// Cleanup.
    delete this.file;
  });

  // Housekeeping: define the expiration time.
  before(function() {
    this.ttl      = 365 * 24 * 60 * 60;// One year.
    this.ttlRange = 30;// Max difference between server and client expiresAt.
  });
  beforeEach(function() {
    this.expiresAt = parseInt(new Date().getTime() / 1000, 10) + this.ttl;
  });
  after(function() {// Cleanup.
    delete this.ttl;
    delete this.expiresAt;
    delete this.ttlRange;
  });

  // Kinvey.File.destroy.
  describe('the destroy method', function() {
    // Housekeeping: upload a file.
    beforeEach(function() {
      var _this = this;
      return Kinvey.File.upload(this.file._data).then(function(response) {
        _this.metadata = response;
      });
    });
    afterEach(function() {// Delete the uploaded file (if not done already).
      return Kinvey.File.destroy(this.metadata._id, { silent: true });
    });
    afterEach(function() {// Cleanup.
      delete this.metadata;
    });

    // Test suite.
    it('should delete a file.', function() {
      var promise = Kinvey.File.destroy(this.metadata._id);
      return expect(promise).to.eventually.have.property('count', 1);
    });
    it('should fail when the file does not exist.', function() {
      var promise = Kinvey.File.destroy(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.BLOB_NOT_FOUND);
      });
    });
    it('should succeed when the file does not exist and the `silent` flag was set.', function() {
      var promise = Kinvey.File.destroy(this.randomID(), { silent: true });
      return expect(promise).to.eventually.have.property('count', 0);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.destroy(this.metadata._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.File.destroy(this.randomID(), options);
    }));
  });

  // Kinvey.File.download.
  describe('the download method', function() {
    // Test suite.
    it('should download a file.', function() {
      var _this   = this;
      var promise = Kinvey.File.download(this.file._id);
      return promise.then(function(response) {
        expect(response).to.contain.keys([
          '_id', '_data', '_downloadURL', '_expiresAt', 'mimeType', 'size'
        ]);
        expect(response.size).to.equal(_this.file.size);
        expect(response.mimeType).to.equal(_this.file.mimeType);
      });
    });
    it('should return a _downloadURL over TLS by default.', function() {
      var promise = Kinvey.File.download(this.file._id);
      return promise.then(function(response) {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^https\:\/\//);
      });
    });
    it('should return an unsafe _downloadURL if `options.tls` was set to false.', function() {
      var promise = Kinvey.File.download(this.file._id, { tls: false });
      return promise.then(function(response) {
        expect(response).to.have.property('_downloadURL');
        expect(response._downloadURL).to.match(/^http\:\/\//);
      });
    });
    it('should support the ttl option.', function() {
      var _this    = this;
      var promise  = Kinvey.File.download(this.file._id, { ttl: this.ttl });
      return promise.then(function(response) {
        expect(response).to.have.property('_expiresAt');

        // Check expires range.
        var ttl = parseInt(new Date(response._expiresAt).getTime() / 1000, 10);
        expect(ttl).to.be.closeTo(_this.expiresAt, _this.ttlRange);
      });
    });
    it('should fail when the file does not exist.', function() {
      var promise = Kinvey.File.download(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.BLOB_NOT_FOUND);
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.File.download(this.file._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.File.download(this.randomID(), options);
    }));
  });

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

});