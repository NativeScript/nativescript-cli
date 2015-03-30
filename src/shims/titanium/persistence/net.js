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

// `Kinvey.Persistence.Net` adapter for Titaniums’
// [HTTPClient](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Network.HTTPClient).
var TiHttp = {
  /**
   * @augments {Kinvey.Persistence.Net.base64}
   */
  base64: function(value) {
    return Titanium.Utils.base64encode(value);
  },

  /**
   * @augments {Kinvey.Persistence.Net.encode}
   */
  encode: function(value) {
    return Titanium.Network.encodeURIComponent(value);
  },

  /**
   * @augments {Kinvey.Persistence.Net.request}
   */
  request: function(method, url, body, headers, options) {
    // Cast arguments.
    headers = headers || {};
    options = options || {};

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();
    var xhr;

    // Stringify if not Titanium.Blob.
    if(isObject(body) && !isFunction(body.getLength)) {
      body = JSON.stringify(body);
    }

    // Create the request.
    if(isMobileWeb) {
      // Use browser XHR on mobile web. Easier binary/header handling.
      xhr = new XMLHttpRequest();

      // Getting a file. Binary response.
      xhr.responseType = options.file ? 'blob' : '';

      if (body instanceof Titanium.Blob) {
        body = body._data;
      }

      xhr.ontimeout = function() {
        deferred.reject('timeout');
      };
    }
    else {
      xhr = Titanium.Network.createHTTPClient();

      // Set the TLS version (iOS only).
      if(isFunction(xhr.setTlsVersion) && Titanium.Network.TLS_VERSION_1_2) {
        xhr.setTlsVersion(Titanium.Network.TLS_VERSION_1_2);
      }

      // Prevent Titanium from defaulting Content-Type on file download.
      // GCS signature is validated with Content-Type header.
      if(method === 'GET' && options.file) {
        headers['Content-Type'] = '';
      }
    }

    xhr.timeout = options.timeout || 0;

    // Listen for request completion.
    xhr.onerror = xhr.onload = function(e) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('The network request completed.', this);
      }

      // Titanium does not provide a clear error code on timeout. Patch here.
      e = e || {};
      if(isString(e.error) && -1 !== e.error.toLowerCase().indexOf('timed out')) {
        e.type = 'timeout';
      }

      // Success implicates 2xx (Successful), or 304 (Not Modified).
      var status = 'timeout' === e.type ? 0 : this.status;
      if(2 === parseInt(status / 100, 10) || 304 === status) {
        var response;

        // Mobile web response.
        if(isMobileWeb) {
          var isBinary = this.responseType === 'blob';

          response = new Titanium.Blob({
            data: isBinary ? this.response : this.responseText,
            length: isBinary ? this.response.size : this.responseText.length,
            mimeType: this.getResponseHeader('Content-Type')
          });
        }
        else {
          response = options.file ? this.responseData : this.responseText;
        }

        // Check `Content-Type` header for application/json
        if (!options.file && response != null) {
          var responseContentType = this.getResponseHeader('Content-Type');
          var error;

          if (responseContentType == null) {
            error = new Kinvey.Error('Content-Type header missing in response. Please add ' +
                                     'Content-Type header to response with value ' +
                                     'application/json.');
          }
          else if (responseContentType.indexOf('application/json') === -1) {
            error = new Kinvey.Error('Response Content-Type header is set to ' +
                                     responseContentType + '. Expected it to be set ' +
                                     'to application/json.');
          }

          if (error) {
            return deferred.reject(error);
          }
        }

        // Return the response.
        deferred.resolve(response || null);
      }
      else { // Failure.
        deferred.reject(this.responseText || e.type || null);
      }
    };

    xhr.open(method, url);

    // Append request headers.
    for(var name in headers) {
      if(headers.hasOwnProperty(name)) {
        xhr.setRequestHeader(name, headers[name]);
      }
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a network request.', method, url, body, headers, options);
    }

    // Initiate the request.
    xhr.send(body);

    // Trigger the `request` event on the subject. The subject should be a
    // Backbone model or collection.
    if(null != options.subject) {
      // Remove `options.subject`.
      var subject = options.subject;
      delete options.subject;

      // Trigger the `request` event if the subject has a `trigger` method.
      if(isFunction(subject.trigger)) {
        subject.trigger('request', subject, xhr, options);
      }
    }

    // Return the response.
    return deferred.promise;
  }
};

// Use Titanium adapter.
Kinvey.Persistence.Net.use(TiHttp);
