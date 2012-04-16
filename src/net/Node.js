(function() {

  // Utilities.
  var https = require('https');
  var url = require('url');

  // Define the Kinvey.Net.Node network adapter.
  Kinvey.Net.Node = Kinvey.Net.Http.extend({
    /**
     * Creates a new Node network adapter.
     * 
     * @name Kinvey.Net.Node
     * @constructor
     * @extends Kinvey.Net.Http
     * @param {string} api One of Kinvey.Net API constants.
     * @param {string} [collection] Collection name. Required when using the
     *          AppData API.
     * @param {string} [id] Entity id.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid api,</li>
     *           <li>On undefined collection.</li>
     *           </ul>
     */
    constructor: function(api, collection, id) {
      Kinvey.Net.Http.prototype.constructor.call(this, api, collection, id);
    },

    /** @lends Kinvey.Net.Node# */

    /**
     * @override
     * @see Kinvey.Net.Http#send
     */
    send: function(success, failure) {
      // Split URL in parts.
      var parts = url.parse(this._getUrl());

      // Build request.
      var self = this;
      var request = https.request({
        host: parts.host,
        path: parts.path,
        method: this.METHOD[this.operation],
        headers: this.headers,
        auth: this._getAuth()
      }, function(response) {
        // Capture data stream.
        var body = '';
        response.on('data', function(data) {
          body += data;
        });

        // Handle response when it completes.
        response.on('end', function() {
          self._handleResponse(response.statusCode, body, success, failure);
        });
      });
      request.on('error', function(error) {// failed to fire request.
        failure({ error: error.code });
      });
      this.data && request.write(JSON.stringify(this.data));// pass body.
      request.end();// fire request.
    }
  });

}());