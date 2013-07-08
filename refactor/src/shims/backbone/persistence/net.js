// `Kinvey.Persistence.Net` adapter for
// [Backbone.ajax](http://backbonejs.org/#Sync-ajax).
var BackboneAjax = {
  /**
   * @augments {Kinvey.Persistence.Net.request}
   */
  base64: function(value) {
    return root.btoa(value);
  },

  /**
   * Flag whether the device supports Blob.
   *
   * @property {boolean}
   */
  supportsBlob: (function() {
    // The latest version of the File API uses `new Blob` to create a Blob
    // object. Older browsers, however, do not support this and fall back to
    // using ArrayBuffer.
    try {
      return new root.Blob() && true;
    }
    catch(e) {
      return false;
    }
  }()),

  /**
   * @augments {Kinvey.Persistence.Net.encode}
   */
  encode: root.encodeURIComponent,

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

    // Append header for compatibility with Android 2.2, 2.3.3, and 3.2.
// http://www.kinvey.com/blog/item/179-how-to-build-a-service-that-supports-every-android-browser
    if(0 === url.indexOf(Kinvey.API_ENDPOINT) && 'GET' === method) {
      var location = root.location;
      if(null != location && null != location.protocol) {
        headers['X-Kinvey-Origin'] = location.protocol + '//' + location.host;
      }
    }

    // Listen for request completion.
    var onComplete = function(request, textStatus) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('The network request completed.', xhr);
      }

      // Success implicates 2xx (Successful), or 304 (Not Modified).
      var status   = request.status;
      if(2 === parseInt(status / 100, 10) || 304 === status) {
        // If `options.file`, convert the response to `Blob` object.
        var response = request.responseText;
        if(options.file && null != response) {
          // jQuery does not provide a nice way to set the responseType to blob,
          // so convert the response to binary manually.
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
          var buffer  = new root.ArrayBuffer(response.length);
          var bufView = new root.Uint8Array(buffer);
          for(var i = 0, length = response.length; i < length; i += 1) {
            bufView[i] = response.charCodeAt(i);
          }

          // If possible, convert the buffer to an actual `Blob` object.
          if(BackboneAjax.supportsBlob) {
            buffer = new root.Blob([bufView], { type: options.file });
          }
          response = buffer;
        }

        // Return the response.
        deferred.resolve(response || null);
      }
      else {// Failure.
        deferred.reject(request.responseText || textStatus || null);
      }
    };

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initiating a network request.', method, url, body, headers, options);
    }

    // Initiate the request.
    if(isObject(body) && !(body instanceof root.ArrayBuffer || body instanceof root.Blob)) {
      body = JSON.stringify(body);
    }
    var xhr = options.xhr = Backbone.ajax({
      complete    : onComplete,
      data        : body,
      dataType    : 'json',
      headers     : headers,
      mimeType    : options.file ? 'text/plain; charset=x-user-defined' : null,
      processData : false,
      timeout     : options.timeout,
      type        : method,
      url         : url,
      beforeSend  : function() {
        if(options.beforeSend) {// Invoke the application-level handler.
          return options.beforeSend.apply(this, arguments);
        }
      }
    });

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

// Use Backbone adapter.
if('undefined' !== typeof Backbone) {
  Kinvey.Persistence.Net.use(BackboneAjax);
}