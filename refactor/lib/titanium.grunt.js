/* jshint node: true */

// Load modules.
var grunt = require('grunt');

/**
 * Titanium test report middleware for Grunt.
 */
module.exports = function(req, res) {
  // Support CORS.
  if(req.headers.origin) {
    // Allow origin and method.
    var method = req.headers['access-control-request-method'] || req.method;
    res.setHeader('Access-Control-Allow-Origin',  req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', method);

    // Allow requested request headers.
    var requestHeaders = req.headers['access-control-request-headers'];
    if(requestHeaders) {
      res.setHeader('Access-Control-Allow-Headers', requestHeaders);
    }

    // Terminate preflight requests here.
    if('OPTIONS' === req.method) {
      return res.end();
    }
  }

  // Obtain the request body.
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });

  // Handle request completion.
  req.on('end', function() {
    data = JSON.parse(data);

    // Return the response.
    res.statusCode = 204;
    res.end();

    // Loop through the test report.
    var pIndex = 0, fIndex = 0;
    data.tests.forEach(function(test) {
      // Determine whether the test passed, failed, or is pending.
      var pass = data.passes[pIndex]   && data.passes[pIndex].fullTitle   === test.fullTitle;
      var fail = data.failures[fIndex] && data.failures[fIndex].fullTitle === test.fullTitle;

      // Log normally if passed, log as error otherwise.
      if(pass) {
        grunt.log.writeln(' ✓ '.green + test.fullTitle);
        pIndex += 1;
      }
      else if(fail) {
        grunt.log.fail(' ✘ ' + test.fullTitle);
        grunt.log.writeln(data.failures[fIndex].error.grey + '\n');
        fIndex += 1;
      }
      else {// Pending.
        grunt.log.writeln((' - ' + test.fullTitle).cyan);
      }
    });

    // Failure might have occured in a hook.
    if(data.failures[fIndex]) {
      var failure = data.failures[fIndex];
      grunt.log.fail(' ✘ ' + failure.fullTitle);
      grunt.log.writeln(failure.error.grey + '\n');
    }
    grunt.log.writeln();

    // Log test summary.
    var stats    = data.stats;
    var duration = (stats.duration / 1000).toFixed(2);
    if(stats.failures) {// Exit the task with failure.
      grunt.log.fail(stats.failures + ' of ' + stats.tests + ' tests failed.');
      grunt.warn(stats.failures + '/' + stats.tests + ' tests failed (' + duration + 's)');
    }
    else {// Success.
      grunt.log.success('  ' + stats.tests + ' tests complete.');
      if(stats.pending) {
        grunt.log.writeln(('  ' + stats.pending + ' tests pending.').cyan);
      }
      grunt.log.writeln();
      grunt.log.ok(stats.passes + ' passed! (' + duration + 's).');
    }

    // This is an asynchronous task, terminate.
    var done = grunt.task.current.async();
    done();
  });
};