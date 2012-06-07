(function() {

  // Utilities.
  var nodeHttps = require('https');
  var nodeUrl = require('url');

  // Define the Kinvey.Store.AppData class.
  Kinvey.Store.AppData.prototype._send = function(method, url, body, options) {
      // For now, include authorization in this adapter. Ideally, it should
      // have some external interface.
      if(null === Kinvey.getCurrentUser() && this.APPDATA_API === this.api) {
        return Kinvey.User.create({}, {
          success: bind(this, function() {
            this._send(method, url, body, options);
          }),
          error: options.error
        });
      }

      // Set headers.
      var headers = {
        Accept: 'application/json, text/javascript',
        Authorization: 'Basic ' + new Buffer(this._getAuth(), 'utf8').toString('base64')
      };
      body && (headers['Content-Type'] = 'application/json; charset=UTF-8');
      headers['Content-Length'] = body ? body.length : 0;

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
            options.success(data);
          }
          else {
            options.error(data);
          }
        };
        response.on('close', onComplete);
        response.on('end', onComplete);
      });

      // Define request error handlers.
      request.on('error', function(error) {
        // Execute application-level handler.
        options.error({
          error: error.code,
          message: error.code
        });
      });

      // Fire request.
      body && request.write(body);// pass body.
      request.end();
    };

}());