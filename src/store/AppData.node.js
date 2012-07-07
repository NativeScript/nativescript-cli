(function() {

  // Utilities.
  var nodeHttps = require('https');
  var nodeUrl = require('url');

  /** @lends Kinvey.Store.AppData# */

  /**
   * Base 64 encodes string.
   * 
   * @private
   * @param {string} value
   * @return {string} Encoded string.
   */
  Kinvey.Store.AppData.prototype._base64 = function(value) {
    return new Buffer(value, 'utf8').toString('base64');
  };

  /**
   * Returns device information.
   * 
   * @private
   * @return {string} Device information
   */
  Kinvey.Store.AppData.prototype._getDeviceInfo = function() {
    // Example: "linux node v0.6.13 0".
    return [
      process.platform,
      process.title,
      process.version,
      0// always set device ID to 0.
    ].map(function(value) {
      return value.toString().toLowerCase().replace(' ', '_');
    }).join(' ');
  };

  /**
   * Sends the request.
   * 
   * @private
   * @param {string} method Request method.
   * @param {string} url Request URL.
   * @param {string} body Request body.
   * @param {Object} options Options.
   */
  Kinvey.Store.AppData.prototype._send = function(method, url, body, options) {
    options || (options = {});
    options.error || (options.error = this.options.error);
    options.success || (options.success = this.options.success);

    // For now, include authorization in this adapter. Ideally, it should
    // have some external interface.
    if(null === Kinvey.getCurrentUser() && this.APPDATA_API === this.api && null === Kinvey.masterSecret) {
      return Kinvey.User.create({}, merge(options, {
        success: bind(this, function() {
          this._send(method, url, body, options);
        })
      }));
    }

    // Set headers.
    var headers = {
      Accept: 'application/json, text/javascript',
      Authorization: this._getAuth(),
      'Content-Length': body ? body.length : 0,
      'X-Kinvey-API-Version': Kinvey.API_VERSION,
      'X-Kinvey-Device-Information': this._getDeviceInfo()
    };
    body && (headers['Content-Type'] = 'application/json; charset=utf-8');

    // Create the request.
    var path = nodeUrl.parse(url);
    var request = nodeHttps.request({
      host: path.host,
      path: path.pathname + (path.search ? path.search : ''),
      method: method,
      headers: headers
    }, function(response) {
      // Capture data stream.
      var data = '';
      response.on('data', function(chunk) {
        data += chunk;
      });

      // Handle response when it completes.
      // @link https://github.com/joyent/node/issues/728
      var onComplete = function() {
        // Data is expected to be either empty, or valid JSON.
        data && (data = JSON.parse(data));

        // Success implicates status 2xx (Successful), or 304 (Not Modified).
        if(2 === parseInt(response.statusCode / 100, 10) || 304 === response.statusCode) {
          options.success(data, { network: true });
        }
        else {
          options.error(data, { network: true });
        }
      };
      response.on('close', onComplete);
      response.on('end', onComplete);
    });

    // Define request error handlers.
    request.on('error', function(error) {
      // Execute application-level handler.
      options.error({
        error: Kinvey.Error.REQUEST_FAILED,
        description: error.error || 'The request failed',
        debug: ''
      }, { network: true });
    });

    // Fire request.
    body && request.write(body);// pass body.
    request.end();
  };

}());