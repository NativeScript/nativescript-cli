# gulp-eslint [![Build Status](https://travis-ci.org/adametry/gulp-eslint.svg)](https://travis-ci.org/adametry/gulp-eslint) [![Coverage Status](https://img.shields.io/coveralls/adametry/gulp-eslint.svg)](https://coveralls.io/r/adametry/gulp-eslint)

> A [gulp](http://gulpjs.com/) plugin for [ESLint](http://eslint.org/).

## Installation

[Use npm](https://docs.npmjs.com/cli/install).

```sh
npm install gulp-eslint
```

## Usage

```javascript
var gulp = require('gulp'),
    eslint = require('gulp-eslint');

gulp.task('lint', function () {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['**/*.js','!node_modules/**'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

gulp.task('default', ['lint'], function () {
    // This will only run if the lint task is successful...
});
```

Or use the plugin API to do things like:

```javascript
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint({
		extends: 'eslint:recommended',
		ecmaFeatures: {
		    'modules': true
		},
		rules: {
			'my-custom-rule': 1,
			'strict': 2
		},
		globals: {
			'jQuery':false,
			'$':true
		},
		envs: [
			'browser'
		]
	}))
	.pipe(eslint.formatEach('compact', process.stderr));
```

For additional examples, look through the [example directory](https://github.com/adametry/gulp-eslint/tree/master/example).

## API

### eslint()

*No explicit configuration.* A `.eslintrc` file may be resolved relative to each linted file.

### eslint(options)

#### options.rules

Type: `Object`

Set [configuration](http://eslint.org/docs/user-guide/configuring#configuring-rules) of [rules](http://eslint.org/docs/rules/).

```javascript
{
	"rules":{
		"camelcase": 1,
		"comma-dangle": 2,
		"quotes": 0
	}
}
```

#### options.globals

Type: `Object`

Specify [globals](http://eslint.org/docs/user-guide/configuring#specifying-globals).

```javascript
{
	"globals":{
		"jQuery": false,
		"$": true
	}
}
```

#### options.fix

Type: `Boolean`

This option instructs ESLint to try to fix as many issues as possible. The fixes are applied to the gulp stream. The fixed content can be saved to file using `gulp.dest` (See [example/fix.js](https://github.com/adametry/gulp-eslint/blob/master/example/fix.js)). Rules that are fixable can be found in ESLint's [rules list](http://eslint.org/docs/rules/).

When fixes are applied, a "fixed" property is set to `true` on the fixed file's ESLint result.

#### options.quiet

Type: `Boolean`

When `true`, this option will filter warning messages from ESLint results. This mimics the ESLint CLI [quiet option](http://eslint.org/docs/user-guide/command-line-interface#quiet).

Type: `function (message, index, list) { return Boolean(); }`

When provided a function, it will be used to filter ESLint result messages, removing any messages that do not return a `true` (or truthy) value.

#### options.envs

Type: `Array`

Specify a list of [environments](http://eslint.org/docs/user-guide/configuring#specifying-environments) to be applied.

Type: `Object`

Specify [environments](http://eslint.org/docs/user-guide/configuring#specifying-environments). Each key must match an existing env definition, and the key determines whether the env’s rules are applied (`true`) or not (`false`).

Alias: `env` *(deprecated)*

#### options.rulePaths

Type: `Array`

This option allows you to specify additional directories from which to load rules files. This is useful when you have custom rules that aren't suitable for being bundled with ESLint. This option works much like the ESLint CLI's [rulesdir option](http://eslint.org/docs/user-guide/command-line-interface#rulesdir).

Type: `String` *(deprecated)*

Load a single rules file.

Alias: `rulesdir` *(deprecated)*

#### options.configFile

Type: `String`

Path to the ESLint rules configuration file. For more information, see the ESLint CLI [config option](http://eslint.org/docs/user-guide/command-line-interface#c-config) and [Using Configuration Files](http://eslint.org/docs/user-guide/configuring#using-configuration-files).

#### options.warnFileIgnored

Type: `Boolean`

When `true`, add a result warning when ESLint ignores a file. This can be used to file files that are needlessly being loaded by `gulp.src`. For example, since ESLint automatically ignores "node_modules" file paths and gulp.src does not, a gulp task may take seconds longer just reading files from the "node_modules" directory.

#### <a name="options.useEslintrc"></a>options.useEslintrc

Type: `Boolean`

When `false`, ESLint will not load [.eslintrc files](http://eslint.org/docs/user-guide/configuring#using-configuration-files).

Alias: `eslintrc` *(deprecated)*

### eslint(configFilePath)

Type: `String`

Shorthand for defining `options.configFile`.

### eslint.result(action)

Type: `function (result) {}`

Call a function for each ESLint file result. No returned value is expected. If an error is thrown, it will be wrapped in a Gulp PluginError and emitted from the stream.

```javascript
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint())
	.pipe(eslint.result(function (result) {
	    // Called for each ESLint result.
	    console.log('ESLint result: ' + result.filePath);
	    console.log('# Messages: ' + result.messages.length);
	    console.log('# Warnings: ' + result.warningCount);
	    console.log('# Errors: ' + result.errorCount);
	}));
```

Type: `function (result, callback) { callback(error); }`

Call an asynchronous function for each ESLint file result. The callback must be called for the stream to finish. If a value is passed to the callback, it will be wrapped in a Gulp PluginError and emitted from the stream.


### eslint.results(action)

Type: `function (results) {}`

Call a function once for all ESLint file results before a stream finishes. No returned value is expected. If an error is thrown, it will be wrapped in a Gulp PluginError and emitted from the stream.

The results list has a "warningCount" property that is the sum of warnings in all results; likewise, an "errorCount" property is set to the sum of errors in all results.

```javascript
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint())
	.pipe(eslint.results(function (results) {
    	// Called once for all ESLint results.
	    console.log('Total Results: ' + results.length);
	    console.log('Total Warnings: ' + results.warningCount);
	    console.log('Total Errors: ' + results.errorCount);
	}));
```

Type: `function (results, callback) { callback(error); }`

Call an asynchronous function once for all ESLint file results before a stream finishes. The callback must be called for the stream to finish. If a value is passed to the callback, it will be wrapped in a Gulp PluginError and emitted from the stream.

### eslint.failOnError()

Stop a task/stream if an ESLint error has been reported for any file.

```javascript
// Cause the stream to stop(/fail) before copying an invalid JS file to the output directory
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint())
	.pipe(eslint.failOnError());
```

### eslint.failAfterError()

Stop a task/stream if an ESLint error has been reported for any file, but wait for all of them to be processed first.

```javascript
// Cause the stream to stop(/fail) when the stream ends if any ESLint error(s) occurred.
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint())
	.pipe(eslint.failAfterError());
```

### eslint.format(formatter, output)

Format all linted files once. This should be used in the stream after piping through `eslint`; otherwise, this will find no ESLint results to format.

The `formatter` argument may be a `String`, `Function`, or `undefined`. As a `String`, a formatter module by that name or path will be resolved as a module, relative to `process.cwd()`, or as one of the [ESLint-provided formatters](https://github.com/eslint/eslint/tree/master/lib/formatters). If `undefined`, the ESLint “stylish” formatter will be resolved. A `Function` will be called with an `Array` of file linting results to format.

```javascript
// use the default "stylish" ESLint formatter
eslint.format()

// use the "checkstyle" ESLint formatter
eslint.format('checkstyle')

// use the "eslint-path-formatter" module formatter
// (@see https://github.com/Bartvds/eslint-path-formatter)
eslint.format('eslint-path-formatter')
```

The `output` argument may be a `WritableStream`, `Function`, or `undefined`. As a `WritableStream`, the formatter results will be written to the stream. If `undefined`, the formatter results will be written to [gulp’s log](https://github.com/gulpjs/gulp-util#logmsg). A `Function` will be called with the formatter results as the only parameter.

```javascript
// write to gulp's log (default)
eslint.format();

// write messages to stdout
eslint.format('junit', process.stdout)
``` 

### eslint.formatEach(formatter, output)

Format each linted file individually. This should be used in the stream after piping through `eslint`; otherwise, this will find no ESLint results to format.

The arguments for `formatEach` are the same as the arguments for `format`.


##Configuration

ESLint may be configured explicity by using any of the following plugin options: `config`, `rules`, `globals`, or `env`. If the [useEslintrc option](#useEslintrc) is not set to `false`, ESLint will attempt to resolve a file by the name of `.eslintrc` within the same directory as the file to be linted. If not found there, parent directories will be searched until `.eslintrc` is found or the directory root is reached.

##Ignore Files

ESLint will ignore files that do not have a `.js` file extension at the point of linting ([some plugins](https://github.com/contra/gulp-coffee) may change file extensions mid-stream). This avoids unintentional linting of non-JavaScript files.

ESLint will also detect an `.eslintignore` file at the cwd or a parent directory. See the [ESLint docs](http://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories) to learn how to construct this file.

## Extensions

ESLint results are attached as an "eslint" property to the vinyl files that pass through a Gulp.js stream pipeline. This is available to streams that follow the initial `eslint` stream. The [eslint.result](#result) and [eslint.results](#results) methods are made available to support extensions and custom handling of ESLint results. 

#### Gulp-Eslint Extensions:
* [gulp-eslint-threshold](https://github.com/krmbkt/gulp-eslint-threshold)
