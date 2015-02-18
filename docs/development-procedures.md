## Development Procedures

### Project Management
*  All development is generally done on *trunk*.
*  Hotfixes are implemented on a branch, with naming convention *&lt;major&gt;.&lt;minor&gt;.x*. If applicable, a new release is pushed, and / or any changes are merged to *trunk* when the hotfix is complete.
*  All releases must be tagged.

General note: since the JavaScript Library is a one-man effort, the above approach works pretty well. Yet, in the future, a more complex branching strategy may be required.

#### Versioning

*  Versioning for the JS Library is on par with the other libraries and should thus yield: *&lt;major&gt;.&lt;minor&gt;.&lt;patch&gt;*.
*  The first library version was *0.9.1*.
*  Version *1.0.0* should not be pushed out before the Backbone refactor process is complete and stable.

### Grunt

The repository is controlled by [grunt](https://github.com/cowboy/grunt). The gruntfile, available in the root of the project, configures the project and defines a series of tasks. *config.json* and *package.json* contain the library and package configuration respectively. Note the version number is part of the package configuration.

#### Build Configuration

The *gruntfile* configures:

*  dir: output directories for software artifacts and API docs.
*  sdk: filename of software artifacts.
*  meta: banner to be prepended to each software artifact.

#### Build Tasks

*  *lint*: performs code audit. Audits source code, tests and generated software artifacts.
*  *concat*: defines the components included in each build.
*  *strip*: micro-optimizes code after concat-ting.
*  *replace*: points the API endpoint to either staging or production, and includes the version number.
*  *mocha*: runs test suite against Node.js.
*  *min*: minifies the software artifacts.
*  *jsdoc*: generates API docs.

Two composite tasks are available for performing a full build. These are available as Jenkins job, and part of the release process:

*  *default*: executes lint, concat, strip, replace, mocha and min tasks. Points to staging.
*  *production*: executes lint, concat, strip, replace, min, jsdoc tasks. Points to production.


### Testing

Tests must be run against the following platforms:

*  Node.js 0.4, 0.6 and 0.8
*  Android Browser 2.2, 2.3.3, 3.2, 4.0 and 4.1
*  Chrome latest stable, and latest [Chromium](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html) snapshot
*  Firefox 4.0 and latest stable
*  Opera latest stable
*  Safari latest stable

On Node.js, running tests is part of the default grunt task. For Node 0.4, execute the following command manually (see package.json):

```shell
mocha --require test/spec.js --timeout 10000 test/*.spec.js test/**/*.spec.js
```

For the different browsers, the testing is done manually by browsing to: http://localhost/js-library/test/spec.html.

By default, all unit tests are run. *spec.html* includes a few browser-specific tests, recognizable by the *.spec.browser.js* extension. spec.js configures the test app, as well as setting helper functions.

Better test coverage for PhoneGap and Titanium, as well as full test automation are on the roadmap.
