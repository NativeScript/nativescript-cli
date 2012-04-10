(function() {

  // Utilities
  var http = require('http');
  var url = require('url');

  // Define a NodeJS network adapter.
  Kinvey.Net.Node = Kinvey.Net.Http.extend({

    /**
     * Sends HTTP request
     * 
     * @param {function(Object)} success Success callback.
     * @param {function(Object)} failure Failure callback.
     * @throws {Error} On invalid operation.
     */
    send: function(success, failure) {
      var parts = url.parse(this._buildEndpoint());

      var client = http.createClient(80, parts.hostname);

      // Add authorization.
      var auth;
      if(null !== deviceUser) {
        auth = deviceUser.getUsername() + ':' + deviceUser.getPassword();
      }
      else {
        auth = Kinvey.appKey + ':' + Kinvey.appSecret;
      }
      this.headers.Authorization = 'Basic ' + new Buffer(auth, 'utf8').toString('base64');

      // Define callbacks and fire request
      var request = client.request(this.METHOD[this.operation], parts.pathname, this.headers);
      
      // Add body
      if(this.data) {
        request.write(JSON.stringify(this.data));
      }

      // Wait for response
      request.on('response', function(response) {
        var data = '';
        response.on('data', function(chunk) {
          data += chunk;
        });
        response.on('end', function() {
          // Determine request success.
          var callback;
          if(200 <= response.statusCode && 300 > response.statusCode || 304 === response.statusCode) {
            callback = success;
          }
          else {
            callback = failure;
          }

          // Parse response
          var d;
          try {
            d = '' !== data ? JSON.parse(data) : data;
          }
          catch(_) {
            callback = failure;
            d = {
              error: 'Error parsing response'
            };
          }

          // Trigger
          callback && callback(d);

        });
      });
      request.end();
    }

  });

}());