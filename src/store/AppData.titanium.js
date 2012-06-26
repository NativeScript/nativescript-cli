(function() {

  /*globals XMLHttpRequest*/

  /** @lends Kinvey.Store.AppData# */

  /**
   * Returns device information.
   * 
   * @private
   * @return {string} Device information
   */
  Kinvey.Store.AppData.prototype._getDeviceInfo = function() {
    // Example: "Titanium mobileweb 2.0.1.GA2 XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXX".
    return [
      'Titanium',
      Titanium.Platform.osname,
      Titanium.Platform.version,
      Titanium.App.getGUID()// device ID.
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
      return Kinvey.User.create({}, {
        success: bind(this, function() {
          this._send(method, url, body, options);
        }),
        error: options.error
      });
    }

    // Create the request. Titanium.Network.createHTTPClient is buggy for
    // Mobile Web, so use the native implementation instead.
    var request;
    if('undefined' === typeof XMLHttpRequest) {
      request = Titanium.Network.createHTTPClient();
    }
    else {
      request = new XMLHttpRequest();
    }
    request.open(method, url, true);
    request.timeout = options.timeout;

    // Set headers.
    var headers = {
      Accept: 'application/json, text/javascript',
      Authorization: 'Basic ' + Titanium.Utils.base64encode(this._getAuth()),
      'X-Kinvey-Device-Information': this._getDeviceInfo()
    };
    body && (headers['Content-Type'] = 'application/json; charset=utf-8');

    // Pass headers to request.
    for(var name in headers) {
      if(headers.hasOwnProperty(name)) {
        request.setRequestHeader(name, headers[name]);
      }
    }

    // Attach request response handler.
    request.onload = function() {
      // Response is expected to be either empty, or valid JSON.
      var response = this.responseText && JSON.parse(this.responseText);

      // Success implicates status 2xx (Successful), or 304 (Not Modified).
      if(2 === parseInt(this.status / 100, 10) || 304 === this.status) {
        options.success(response, { network: true });
      }
      else {
        options.error(response, { network: true });
      }
    };

    // Define request error handlers.
    request.onerror = function(error) {
      // Execute application-level handler.
      var msg = error.error || 'Unknown error';
      options.error({
        error: msg,
        message: msg
      }, { network: true });
    };

    // Fire request.
    request.send(body);
  };

}());