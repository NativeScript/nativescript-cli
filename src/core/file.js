/**
 * Copyright 2014 Kinvey, Inc.
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

/* jshint sub: true */

// Files.
// ------

// REST API wrapper for files.

/**
 * @memberof! <global>
 * @namespace Kinvey.File
 */
Kinvey.File = /** @lends Kinvey.File */{
  /**
   * Deletes a file.
   *
   * @param {string} name Name.
   * @param {Options} [options] Options.
   * @param {boolean} [options.silent=false] Succeed if the file did not exist
   *          prior to deleting.
   * @returns {Promise} The response.
   */
  destroy: function(id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Deleting a file.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.destroy({
      namespace : FILES,
      id        : id,
      auth      : Auth.Default
    }, options).then(null, function(error) {
      // If `options.silent`, treat `BLOB_NOT_FOUND` as success.
      if(options.silent && Kinvey.Error.BLOB_NOT_FOUND === error.name) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('The file does not exist. Returning success because of the silent flag.');
        }

        // Return the response.
        return { count: 0 };
      }
      return Kinvey.Defer.reject(error);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Deleted the file.', response);
      }, function(error) {
        log('Failed to delete the file.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Downloads a file.
   *
   * @param {string} id File id.
   * @param {Options} [options] Options.
   * @param {boolean} [options.stream=false] Stream instead of download.
   * @param {boolean} [options.tls=true] Use the https protocol to communicate
   *          with GCS.
   * @param {integer} [options.ttl] A custom expiration time (in seconds).
   * @returns {Promise} The file metadata if `options.stream`, a file resource
   *            otherwise.
   */
  download: function(id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Downloading a file.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Build the flags.
    var flags = {};
    if(false !== options.tls) {
      flags.tls = true;
    }
    if(options.ttl) {
      flags.ttl_in_seconds = options.ttl;
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace  : FILES,
      id         : id,
      flags      : flags,
      auth       : Auth.Default
    }, options).then(function(response) {
      // If `options.stream`, return the file metadata instead of the resource.
      if(options.stream) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('Returning the file metadata only because of the stream flag.');
        }
        return response;
      }

      // Temporarily reset some options to avoid invoking the callbacks
      // multiple times.
      var success = options.success;
      var error   = options.error;
      delete options.success;
      delete options.error;

      // Download the actual file, and return the composite response.
      return Kinvey.File.downloadByUrl(response, options).then(function(response) {
        // Restore the options and return the response.
        options.success = success;
        options.error   = error;
        return response;
      }, function(reason) {
        // Restore the options and return the error.
        options.success = success;
        options.error   = error;
        return Kinvey.Defer.reject(reason);
      });
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Downloaded the file.', response);
      }, function(error) {
        log('Failed to download the file.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Downloads a file given its URL or metadata object.
   *
   * @param {Object|string} metadataOrUrl File download URL, or metadata.
   * @param {Options} [options]           Options.
   * @param {Object}  [options.headers]   Any request headers to send to GCS.
   * @returns {Promise} The file metadata and resource.
   */
  downloadByUrl: function(metadataOrUrl, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Downloading a file by URL.', arguments);
    }

    // Cast arguments.
    var metadata    = isObject(metadataOrUrl) ? metadataOrUrl : { _downloadURL: metadataOrUrl };
    options         = options || {};
    options.file    = metadata.mimeType || 'application-octet-stream';
    options.headers = options.headers || {};
    delete options.headers['Content-Type'];

    // Download the file, and return a composite response.
    var url      = metadata._downloadURL;
    var download = Kinvey.Persistence.Net.request('GET', url, null, options.headers, options);
    download = download.then(function(data) {
      metadata._data = data;// Merge into the file metadata.
      return metadata;
    }, function(reason) {
      // Since the error originates from a different host, convert it into a
      // `BLOB_NOT_FOUND` client-side error.
      var error = clientError(Kinvey.Error.REQUEST_ERROR, {
        description : 'This file could not be downloaded from the provided URL.',
        debug       : reason
      });
      return Kinvey.Defer.reject(error);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      download.then(function(response) {
        log('Downloaded the file by URL.', response);
      }, function(error) {
        log('Failed to download a file by URL.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(download, options);
  },

  /**
   * Retrieves all files matching the provided query.
   *
   * @param {Kinvey.Query} [query] The query.
   * @param {Object} [options] Options.
   * @param {boolean} [options.download] Download the actual file resources.
   * @param {boolean} [options.tls=true] Use the https protocol to communicate
   *          with GCS.
   * @param {integer} [options.ttl] A custom expiration time.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} A list of files.
   */
  find: function(query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving files by query.', arguments);
    }

    // Validate arguments.
    if(null != query && !(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Cast arguments.
    options = options || {};

    // Build the flags.
    var flags = {};
    if(false !== options.tls) {
      flags.tls = true;
    }
    if(options.ttl) {
      flags.ttl_in_seconds = options.ttl;
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace : FILES,
      query     : query,
      flags     : flags,
      auth      : Auth.Default
    }, options).then(function(response) {
      // If `options.download`, download the file resources.
      if(options.download) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('Obtaining the file resources.', response);
        }

        // Temporarily reset some options to avoid invoking the callbacks
        // multiple times.
        var success = options.success;
        var error   = options.error;
        delete options.success;
        delete options.error;

        // Download the actual files in parallel, and return the composite
        // response.
        var promises = response.map(function(file) {
          return Kinvey.File.downloadByUrl(file, options);
        });
        return Kinvey.Defer.all(promises).then(function(response) {
          // Restore the options and return the response.
          options.success = success;
          options.error   = error;
          return response;
        }, function(reason) {
          // Restore the options and return the error.
          options.success = success;
          options.error   = error;
          return Kinvey.Defer.reject(reason);
        });
      }
      return response;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved the files by query.', response);
      }, function(error) {
        log('Failed to retrieve the files by query.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Streams a file.
   *
   * @param {string} name Name.
   * @param {Options} [options] Options.
   * @param {boolean} [options.tls=true] Use the https protocol to communicate
   *          with GCS.
   * @param {integer} [options.ttl] A custom expiration time.
   * @returns {Promise} The download URI.
   */
  stream: function(name, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Streaming a file.', arguments);
    }

    // Forward to `Kinvey.File.download`, with the `stream` flag set.
    options = options || {};
    options.stream = true;
    return Kinvey.File.download(name, options);
  },

  /**
   * Uploads a file.
   *
   * @param {*}       file               The file.
   * @param {Object}  [data]             The files’ metadata.
   * @param {Options} [options]          Options.
   * @param {boolean} [options.public]   Mark the file publicly-readable.
   * @param {boolean} [options.tls=true] Use the https protocol to communicate
   *          with GCS.
   * @returns {Promise} The response.
   */
  upload: function(file, data, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Uploading a file.', arguments);
    }

    // Cast arguments.
    file    = file    || {};
    data    = data    || {};
    options = options || {};

    // Attempt to extract metadata from the file resource.
    if(null == data._filename && (null != file._filename || null != file.name)) {
      data._filename = file._filename || file.name;
    }
    if(null == data.size && (null != file.size || null != file.length)) {
      data.size = file.size || file.length;
    }
    data.mimeType = data.mimeType || file.mimeType || file.type || 'application/octet-stream';

    // Apply options.
    if(options['public']) {
      data._public = true;
    }
    options.contentType = data.mimeType;

    // Prepare the response.
    var promise = null != data._id ? Kinvey.Persistence.update({
      namespace : FILES,
      id        : data._id,
      data      : data,
      flags     : false !== options.tls ? { tls: true } : null,
      auth      : Auth.Default
    }, options) : Kinvey.Persistence.create({
      namespace : FILES,
      data      : data,
      flags     : false !== options.tls ? { tls: true } : null,
      auth      : Auth.Default
    }, options);

    // Prepare the actual file upload.
    promise = promise.then(function(response) {
      var url     = response._uploadURL;
      var headers = response._requiredHeaders || {};
      headers['Content-Type'] = options.contentType;

      // Delete fields from the response.
      delete response._expiresAt;
      delete response._requiredHeaders;
      delete response._uploadURL;

      // Upload the file, and return a composite response.
      var upload = Kinvey.Persistence.Net.request('PUT', url, file, headers, options);
      return upload.then(function() {
        response._data = file;// Merge into the file metadata.
        return response;
      });
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Uploaded the file.', response);
      }, function(error) {
        log('Failed to upload the file.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  }
};