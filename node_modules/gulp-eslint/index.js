'use strict';

var BufferStreams = require('bufferstreams');
var PluginError = require('gulp-util').PluginError;
var CLIEngine = require('eslint').CLIEngine;
var util = require('./util');
var path = require('path');

/**
 * Append ESLint result to each file
 *
 * @param {(Object|String)} [options] - Configure rules, env, global, and other options for running ESLint
 * @returns {stream} gulp file stream
 */
function gulpEslint(options) {
	options = util.migrateOptions(options);
	var linter = new CLIEngine(options);

	function verify(str, filePath) {
		var result = linter.executeOnText(str, filePath).results[0];
		// Note: Fixes are applied as part of "executeOnText".
		// Any applied fix messages have been removed from the result.

		if (options.quiet) {
			// ignore warnings
			result = util.filterResult(result, options.quiet);
		}

		return result;
	}

	return util.transform(function(file, enc, cb) {
		var filePath = path.relative(process.cwd(), file.path);

		if (file.isNull()) {
			// quietly ignore null files (read:false or directories)
			cb(null, file);

		} else if (linter.isPathIgnored(filePath)) {
			// Note:
			// Vinyl files can have an independently defined cwd, but ESLint works relative to `process.cwd()`.
			// (https://github.com/gulpjs/gulp/blob/master/docs/recipes/specifying-a-cwd.md)
			// Also, ESLint doesn't adjust file paths relative to an ancestory .eslintignore path.
			// E.g., If ../.eslintignore has "foo/*.js", ESLint will ignore ./foo/*.js, instead of ../foo/*.js.
			// Eslint rolls this into `CLIEngine.executeOnText`. So, gulp-eslint must account for this limitation.

			if (linter.options.ignore && options.warnFileIgnored) {
				// Warn that gulp.src is needlessly reading files that ESLint ignores
				file.eslint = util.createIgnoreResult(file);
			}
			cb(null, file);

		} else if (file.isStream()) {
			// ESLint is synchronous, so wait for the complete contents
			// replace content stream with new readable content stream
			file.contents = file.contents.pipe(new BufferStreams(function(err, buf, done) {
				file.eslint = verify(String(buf), filePath);
				// Update the fixed output; otherwise, fixable messages are simply ignored.
				if (file.eslint.hasOwnProperty('output')) {
					buf = new Buffer(file.eslint.output);
					file.eslint.fixed = true;
				}
				done(null, buf);
				cb(null, file);
			}));

		} else {
			file.eslint = verify(file.contents.toString(), filePath);
			// Update the fixed output; otherwise, fixable messages are simply ignored.
			if (file.eslint.hasOwnProperty('output')) {
				file.contents = new Buffer(file.eslint.output);
				file.eslint.fixed = true;
			}
			cb(null, file);
		}
	});
}

/**
 * Handle each ESLint result as it passes through the stream.
 *
 * @param {Function} action - A function to handle each ESLint result
 * @returns {stream} gulp file stream
 */
gulpEslint.result = function(action) {
	if (typeof action !== 'function') {
		throw new Error('Expected callable argument');
	}

	return util.transform(function(file, enc, done) {
		if (file.eslint) {
			util.tryResultAction(action, file.eslint, util.handleCallback(done, file));
		} else {
			done(null, file);
		}
	});
};

/**
 * Handle all ESLint results at the end of the stream.
 *
 * @param {Function} action - A function to handle all ESLint results
 * @returns {stream} gulp file stream
 */
gulpEslint.results = function(action) {
	if (typeof action !== 'function') {
		throw new Error('Expected callable argument');
	}

	var results = [];
	results.errorCount = 0;
	results.warningCount = 0;

	return util.transform(function(file, enc, done) {
		if (file.eslint) {
			results.push(file.eslint);
			// collect total error/warning count
			results.errorCount += file.eslint.errorCount;
			results.warningCount += file.eslint.warningCount;
		}
		done(null, file);

	}, function(done) {
		util.tryResultAction(action, results, util.handleCallback(done));
	});
};

/**
 * Fail when an ESLint error is found in ESLint results.
 *
 * @returns {stream} gulp file stream
 */
gulpEslint.failOnError = function() {
	return gulpEslint.result(function(result) {
		var error = util.firstResultMessage(result, util.isErrorMessage);
		if (error) {
			throw new PluginError(
				'gulp-eslint',
				{
					name: 'ESLintError',
					fileName: result.filePath,
					message: error.message,
					lineNumber: error.line
				}
			);
		}
	});
};

/**
 * Fail when the stream ends if any ESLint error(s) occurred
 *
 * @returns {stream} gulp file stream
 */
gulpEslint.failAfterError = function() {
	return gulpEslint.results(function(results) {
		var count = results.errorCount;
		if (count > 0) {
			throw new PluginError(
				'gulp-eslint',
				{
					name: 'ESLintError',
					message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors')
				}
			);
		}
	});
};

/**
 * Format the results of each file individually.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a ESLint result formatter
 * @param {(Function|Stream)} [writable=gulp-util.log] - A funtion or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.formatEach = function(formatter, writable) {
	formatter = util.resolveFormatter(formatter);
	writable = util.resolveWritable(writable);

	return gulpEslint.result(function(result) {
		util.writeResults([result], formatter, writable);
	});
};

/**
 * Wait until all files have been linted and format all results at once.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a ESLint result formatter
 * @param {(Function|stream)} [writable=gulp-util.log] - A funtion or stream to write the formatted ESLint results.
 * @returns {stream} gulp file stream
 */
gulpEslint.format = function(formatter, writable) {
	formatter = util.resolveFormatter(formatter);
	writable = util.resolveWritable(writable);

	return gulpEslint.results(function(results) {
		// Only format results if files has been lint'd
		if (results.length) {
			util.writeResults(results, formatter, writable);
		}
	});
};

module.exports = gulpEslint;
