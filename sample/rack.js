'use strict';
require('babel-core/register');
var _ = require('lodash');
var http = require('http');
var https = require('https');
var url = require('url');
var HttpMethod = require('../src/core/enums').HttpMethod;
var Promise = require('bluebird');
var Middleware = require('../src/rack/middleware');
var Rack = require('../src/rack/rack');
var HttpMiddleware = require('../src/rack/http');
var ParserMiddleware = require('../src/rack/parser');
var Kinvey = require('../src/kinvey');
var Log = require('../src/core/log');
Log.disableAll();

class CustomHttpMiddleware extends Middleware {
  constructor() {
    super('Custom Http Middleware');
  }

  handle(request) {
    return super.handle(request).then(function() {
      var adapter = http;
      var protocol = url.parse(request.url).protocol;
      var hostname = url.parse(request.url).hostname;
      var port = url.parse(request.url).port || 80;
      var flags = request.flags || {};
      var data = request.data;
      var length = 0;

      if (protocol === 'https:') {
        adapter = https;
        port = 443;
      }

      if (data instanceof Buffer) {
        length = data.length;
      } else if (data) {
        if (!_.isString(data)) {
          data = String(data);
        }

        length = Buffer.byteLength(data);
      }

      request.headers['Content-Length'] = length;

      if (request.query) {
        var query = _.result(request.query, 'toJSON', request.query);
        flags.query = query.filter;

        if (!_.isEmpty(query.fields)) {
          flags.fields = query.fields.join(',');
        }

        if (query.limit) {
          flags.limit = query.limit;
        }

        if (query.skip > 0) {
          flags.skip = query.skip;
        }

        if (!_.isEmpty(query.sort)) {
          flags.sort = query.sort;
        }
      }

      for (const key in flags) {
        if (flags.hasOwnProperty(key)) {
          flags[key] = _.isString(flags[key]) ? flags[key] : JSON.stringify(flags[key]);
        }
      }

      return new Promise((resolve, reject) => {
        const httpRequest = adapter.request({
          method: request.method,
          hostname: hostname,
          port: port,
          headers: request.headers,
          path: url.format({
            pathname: request.pathname,
            query: flags
          })
        });

        httpRequest.on('response', function(httpResponse) {
          var httpResponseData = [];

          httpResponse.on('data', function(chunk) {
            httpResponseData.push(new Buffer(chunk));
          });

          httpResponse.on('end', function() {
            request.response = {
              statusCode: httpResponse.statusCode,
              headers: httpResponse.headers,
              data: Buffer.concat(httpResponseData).toString()
            };

            resolve(request);
          });
        });

        httpRequest.on('error', function(error) {
          reject(error);
        });

        if (data && (request.method === HttpMethod.POST || request.method === HttpMethod.PATCH || request.method === HttpMethod.PUT)) {
          httpRequest.write(data);
        }

        httpRequest.end();
      });
    });
  }
}

class CustomParserMiddleware extends Middleware {
  constructor() {
    super('Customer Parser Middleware');
  }

  handle(request) {
    return super.handle(request).then(function() {
      var response = request.response;

      if (response && response.data) {
        const contentType = response.headers['content-type'] || response.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (err) {
            response.data = response.data;
          }

          if (_.isArray(response.data)) {
            response.data = response.data.map(function(data) {
              data.foo = 'bar';
              return data;
            });
          } else {
            response.data.foo = 'bar';
          }

          request.response = response;
        }
      }

      return request;
    });
  }
}

var networkRack = Rack.networkRack;

// Print out the network rack middleware stack
console.log('Before swapping out middleware')
console.log(networkRack.toString());
console.log('\n');

networkRack.swap(HttpMiddleware, new CustomHttpMiddleware());
networkRack.swap(ParserMiddleware, new CustomParserMiddleware());
Rack.networkRack = networkRack;

// Print out the network rack middleware stack
console.log('After swapping out middleware')
console.log(networkRack.toString());
console.log('\n');

// Initialize the library
Kinvey.init({
  appId: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

var User = require('../src/core/models/user');
var NetworkStore = require('../src/core/stores/networkStore');
var store = new NetworkStore('books');

// Login the admin user
var promise = User.login('admin', 'admin');
promise.then(function() {
  // Find books using our custom http middleware
  return store.find();
}).then(function(books) {
  books.forEach(function(book) {
    console.log(book.toJSON());
  });
  console.log('\n');
}).catch(function(error) {
  console.log(error);
  console.log('\n');
});
