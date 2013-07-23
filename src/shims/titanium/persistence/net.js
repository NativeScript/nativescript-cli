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
    body    = body    || null;
    headers = headers || {};
    options = options || {};

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Create the request.
    var request = options.xhr = Titanium.Network.createHTTPClient();
    request.open(method, url);

    // Apply options.
    if(0 < options.timeout) {
      request.timeout = options.timeout;
    }

    // Append request headers.
    for(var name in headers) {
      if(headers.hasOwnProperty(name)) {
        request.setRequestHeader(name, headers[name]);
      }
    }

    // For mobile web, setting an explicit mime type is required to obtain
    // binary data.
    if(isMobileWeb && options.file) {
      request._xhr.overrideMimeType('text/plain; charset=x-user-defined');
    }

    // Timeouts do not invoke the error handler on mobileweb. Patch here.
    if(isMobileWeb) {
      var abort = request.abort;
      request.abort = function() {
        if(request.DONE > request.readyState) {
          request.onerror({ type: 'timeout' });
          request.onerror = function() { };// Avoid multiple invocations.
        }
        return abort.apply(request, arguments);
      };
    }

    // Listen for request completion.
    request.onerror = request.onload = function(event) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('The network request completed.', request);
      }

      // Titanium does not provide a clear error code on timeout. Patch here.
      event = event || {};
      if(isString(event.error) && -1 !== event.error.toLowerCase().indexOf('timed out')) {
        event.type = 'timeout';
      }

      // Success implicates 2xx (Successful), or 304 (Not Modified).
      var status = 'timeout' === event.type ? 0 : request.status;
      if(2 === parseInt(status / 100, 10) || 304 === status) {
        // Parse the response.
        var response = !isMobileWeb && options.file ? request.responseData : request.responseText;

        // Get binary response data on Titanium mobileweb.
        if(isMobileWeb && options.file && null != response && null != root.ArrayBuffer) {
          var buffer  = new root.ArrayBuffer(response.length);
          var bufView = new root.Uint8Array(buffer);
          for(var i = 0, length = response.length; i < length; i += 1) {
            bufView[i] = response.charCodeAt(i);
          }

          // Cast the response to a new Titanium.Blob object.
// NOTE The `toString` method remains broken. Use `FileReader` if you want to obtain the Data URL.
          response = new Titanium.Blob({
            data     : bufView,
            length   : bufView.length,
            mimeType : options.file
          });
        }

        // Return the response.
        deferred.resolve(response || null);
      }
      else {// Failure.
        deferred.reject(request.responseText || event.type || null);
      }
    };

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a network request.', method, url, body, headers, options);
    }

    // Patch Titanium mobileweb.
    if(isMobileWeb) {
      // Prevent Titanium from appending an incorrect Content-Type header.
      var setHeader = request._xhr.setRequestHeader;
      request._xhr.setRequestHeader = function(name) {
        return 'Content-Type' === name ? null : setHeader.apply(request._xhr, arguments);
      };

      // Prevent Titanium from URL encoding blobs.
      if(body instanceof Titanium.Blob) {
        var send = request._xhr.send;
        request._xhr.send = function() {
          return send.call(request._xhr, body._data);
        };
      }
    }

    // Initiate the request.
    if(isObject(body) && !isFunction(body.getLength)) {
      body = JSON.stringify(body);
    }
    request.send(body);

    // Trigger the `request` event on the subject. The subject should be a
    // Backbone model or collection.
    if(null != options.subject) {
      // Remove `options.subject`.
      var subject = options.subject;
      delete options.subject;

      // Trigger the `request` event if the subject has a `trigger` method.
      if(isFunction(subject.trigger)) {
        subject.trigger('request', subject, request, options);
      }
    }

    // Return the response.
    return deferred.promise;
  }
};

// Use Titanium adapter.
Kinvey.Persistence.Net.use(TiHttp);