'use strict';

var TransformStream = require('stream').Transform,
	gutil = require('gulp-util'),
	objectAssign = require('object-assign'),
	CLIEngine = require('eslint').CLIEngine;

/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - An async function that is called for each stream chunk
 * @param {Function} [flush] - An async function that is called before closing the stream
 * @returns {stream} A transform stream
 */
exports.transform = function(transform, flush) {
	var stream = new TransformStream({
		objectMode: true
	});
	stream._transform = transform;
	if (typeof flush === 'function') {
		stream._flush = flush;
	}
	return stream;
};

/**
 * Mimic the CLIEngine's createIgnoreResult function,
 * only without the ESLint CLI reference.
 *
 * @param {Object} file - file with a "path" property
 * @returns {Object} An ESLint report with an ignore warning
 */
exports.createIgnoreResult = function(file) {
	return {
		filePath: file.path,
		messages: [{
			fatal: false,
			severity: 1,
			message: file.path.indexOf('node_modules/') < 0 ?
				'File ignored because of .eslintignore file' :
				'File ignored because it has a node_modules/** path'
		}],
		errorCount: 0,
		warningCount: 1
	};
};

/**
 * Create config helper to merge various config sources
 *
 * @param {Object} options - options to migrate
 * @returns {Object} migrated options
 */
exports.migrateOptions = function migrateOptions(options) {
	if (typeof options === 'string') {
		// basic config path overload: gulpEslint('path/to/config.json')
		options = {
			configFile: options
		};
	} else {
		options = objectAssign({}, options);
	}

	if (options.extends || options.ecmaFeatures) {
		// nest options as baseConfig, since it's basically an .eslintrc config file
		options.baseConfig = objectAssign(options.baseConfig || {}, options, {baseConfig: null});
	}

	options.globals = options.globals || options.global;
	if (options.globals != null && !Array.isArray(options.globals)) {
		options.globals = Object.keys(options.globals).map(function cliGlobal(key) {
			return options.globals[key] ? key + ':true' : key;
		});
	}

	options.envs = options.envs || options.env;
	if (options.envs != null && !Array.isArray(options.envs)) {
		options.envs = Object.keys(options.envs).filter(function cliEnv(key) {
			return options.envs[key];
		});
	}

	if (options.config != null) {
		// The "config" option has been deprecated. Use "configFile".
		options.configFile = options.config;
	}

	if (options.rulesdir != null) {
		// The "rulesdir" option has been deprecated. Use "rulePaths".
		if (typeof options.rulesdir === 'string') {
			options.rulePaths = [options.rulesdir];
		} else {
			options.rulePaths = options.rulesdir;
		}
	}

	if (options.eslintrc != null) {
		// The "eslintrc" option has been deprecated. Use "useEslintrc".
		options.useEslintrc = options.eslintrc;
	}

	return options;
};

/**
 * Ensure that callback errors are wrapped in a gulp PluginError
 *
 * @param {Function} callback - callback to wrap
 * @param {Object} [value=] - A value to pass to the callback
 * @returns {Function} A callback to call(back) the callback
 */
exports.handleCallback = function(callback, value) {
	return function(err) {
		if (err != null && !(err instanceof gutil.PluginError)) {
			err = new gutil.PluginError(err.plugin || 'gulp-eslint', err, {
				showStack: (err.showStack !== false)
			});
		}
		callback(err, value);
	};
};

/**
 * Call sync or async action and handle any thrown or async error
 *
 * @param {Function} action - Result action to call
 * @param {(Object|Array)} result - An ESLint result or result list
 * @param {Function} done - An callback for when the action is complete
 */
exports.tryResultAction = function(action, result, done) {
	try {
		if (action.length > 1) {
			// async action
			action.call(this, result, done);
		} else {
			// sync action
			action.call(this, result);
			done();
		}
	} catch (error) {
		done(error == null ? new Error('Unknown Error') : error);
	}
};

/**
 * Get the first item in a list that meets a condition
 *
 * @param {Array} list - A list to search
 * @param {Function} condition - A condition function that is passed an item and returns a boolean
 * @returns {(Object|Null)} The first item to meet a condition or null, if no item meets the condition
 */
function first(list, condition) {
	for (var i = 0, len = list && list.length || 0; i < len; i++) {
		if (condition(list[i])) {
			return list[i];
		}
	}
	return null;
}

/**
 * Get first message in an ESLint result to meet a condition
 *
 * @param {Object} result - An ESLint result
 * @param {Function} condition - A condition function that is passed a message and returns a boolean
 * @returns {Object} The first message to pass the condition or null
 */
exports.firstResultMessage = function(result, condition) {
	return first(result.messages, condition);
};

/**
 * Determine if a message is an error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is an error message
 */
function isErrorMessage(message) {
	var level = message.fatal ? 2 : message.severity;
	if (Array.isArray(level)) {
		level = level[0];
	}
	return (level > 1);
}
exports.isErrorMessage = isErrorMessage;

/**
 * Increment count if message is an error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
function countErrorMessage(count, message) {
	return count + isErrorMessage(message);
}

/**
 * Increment count if message is a warning
 *
 * @param {Number} count - count of warnings
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of warnings, message included
 */
function countWarningMessage(count, message) {
	return count + (message.severity === 1);
}

/**
 * Filter result messages, update error and warning counts
 *
 * @param {Object} result - an ESLint result
 * @param {Function} [filter=isErrorMessage] - A function that evaluates what messages to keep
 * @returns {Object} A filtered ESLint result
 */
exports.filterResult = function(result, filter) {
	if (typeof filter !== 'function') {
		filter = isErrorMessage;
	}
	var messages = result.messages.filter(filter, result);
	return {
		filePath: result.filePath,
		messages: messages,
		errorCount: messages.reduce(countErrorMessage, 0),
		warningCount: messages.reduce(countWarningMessage, 0)
	};
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 *
 * @throws TypeError thrown if unable to resolve the formatter type
 * @param {(String|Function)} [formatter=stylish] - A name to resolve as a formatter. If a function is provided, the same function is returned.
 * @returns {Function} An ESLint formatter
 */
exports.resolveFormatter = function(formatter) {
	// use ESLint to look up formatter references
	if (typeof formatter !== 'function') {
		// load formatter (module, relative to cwd, ESLint formatter)
		formatter =	CLIEngine.getFormatter(formatter) || formatter;
	}

	if (typeof formatter !== 'function') {
		// formatter not found
		throw new TypeError('Invalid Formatter');
	}

	return formatter;
};

/**
 * Resolve writable
 *
 * @param {(Function|stream)} [writable=gulp-util.log] - A stream or function to resolve as a format writer
 * @returns {Function} A function that writes formatted messages
 */
exports.resolveWritable = function(writable) {
	if (!writable) {
		writable = gutil.log;
	} else if (typeof writable.write === 'function') {
		writable = writable.write.bind(writable);
	}
	return writable;
};

/**
 * Write formatter results to writable/output
 *
 * @param {Object[]} results - A list of ESLint results
 * @param {Function} formatter - A function used to format ESLint results
 * @param {Function} writable - A function used to write formatted ESLint results
 */
exports.writeResults = function(results, formatter, writable) {
	var config;
	if (!results) {
		results = [];
	}
	// get the first result config
	results.some(function(result) {
		config = result && result.config;
		return config;
	});

	var message = formatter(results, config || {});
	if (writable && message != null && message !== '') {
		writable(message);
	}
};
