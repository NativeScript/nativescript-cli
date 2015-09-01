/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Gruntfile.
 */
module.exports = function(grunt) {
  // Setup.
  // ------

  // Parse the command-line options.
  var env   = grunt.option('env')   || grunt.option('env', 'staging');
  var build = grunt.option('build') || grunt.option('build', 'html5');
  grunt.log.subhead('Environment: ' + env + ', build: ' + build);

  // Adapt config file to the current environment.
  var config = require('./config.json');
  grunt.util._.extend(config, config[env]);

  // Load external tasks.
  [
    'grunt-jsbeautifier',
    'grunt-contrib-clean',
    'grunt-contrib-connect',
    'grunt-contrib-concat',
    'grunt-contrib-copy',
    'grunt-contrib-jshint',
    'grunt-contrib-uglify',
    'grunt-contrib-watch',
    'grunt-jsdoc',
    'grunt-jsonlint',
    'grunt-karma',
    'grunt-mocha',
    'grunt-shell',
    'grunt-simple-mocha'
  ].forEach(grunt.loadNpmTasks);
  grunt.renameTask('connect', 'server');

  // Project configuration.
  // ----------------------
  grunt.initConfig({
    // Options.
    build : build,
    env   : env,

    // Metadata.
    config : config,
    pkg    : require('./package.json'),

    // Code audits.
    jsonlint: {
      all: { src: [ '.jshintrc', 'config.json', 'package.json', 'lib/jsdoc.json' ] }
    },
    jshint: {
      options   : { jshintrc: true },
      gruntfile : { src: 'Gruntfile.js' },
      src       : { src: 'src/**/*.js' },
      test      : { src: 'test/**/*.js' },
      dist      : { src: 'dist/<%= env %>/dist.js' }
    },

    // Concatenation & minification.
    concat: {
      options: { separator : ';\n' },
      dist: {
        options: {// Overrides.
          banner       : grunt.file.read('src/intro.txt') + '<%= concat.dist.options.separator %>',
          footer       : '<%= concat.dist.options.separator %>' + grunt.file.read('src/outro.txt'),
          process      : true,
          separator    : '\n\n',// Double line-feed.
          stripBanners : true// Remove license (is already in `intro.txt`).
        },
        dest: 'dist/<%= env %>/dist.js',
        src: [
          // Log
          build === 'nodejs' ? 'src/internals/log/logger-node.js' : 'src/internals/log/logger.js',
          'src/core/log.js',

          // Setup.
          'src/kinvey.js',
          'src/core/error.js',
          'src/core/utils.js',
          'src/core/defer.js',
          'src/core/auth.js',
          'src/core/device.js',
          'src/core/clientAppVersion.js',
          'src/core/customRequestProperties.js',

          // Features.
          'src/core/acl.js',
          'src/core/aggregation.js',
          'src/core/command.js',
          'src/core/datastore.js',
          'src/core/file.js',
          'src/core/metadata.js',
          'src/core/social.js',
          'src/core/user.js',
          'src/core/mic.js',
          'src/core/query.js',
          'src/core/reference.js',

          // Persistence.
          'src/core/persistence.js',
          'src/core/persistence/database.js',
          'src/core/persistence/local.js',
          'src/core/persistence/net.js',
          'src/core/persistence/sync.js'
        ].concat(config.build[build].internals),
        nonull: true// Warning on missing files.
      },
      dependencies: {
        dest   : '<%= clean.intermediate %>/dependencies.js',
        src    : config.build[build].dependencies,
        nonull : true// Warning on missing files.
      },
      build: {
        dest   : 'dist/<%= env %>/build.js',
        src    : config.build[build].externals.concat('dist/<%= env %>/dist.js'),
        nonull : true// Warning on missing files.
      },
      pack: {
        dest   : 'dist/<%= env %>/build.min.js',
        src    : config.build[build].externals.concat('dist/<%= env %>/dist.min.js'),
        nonull : true// Warning on missing files.
      }
    },
    jsbeautifier: {
      options: {
        js: {
          braceStyle             : 'end-expand',// End braces on own line.
          indentSize             : 2,
          spaceBeforeConditional : false
        }
      },
      files: 'dist/<%= env %>/dist.js'
    },
    uglify: {
      options: {
        compress: {// Enable debug mode if desired.
          global_defs: { KINVEY_DEBUG: grunt.option('with-debug') || false }
        },
        preserveComments: 'some',// Keep “important” comments.
        report: 'min'
      },
      dist: {
        files: {
          'dist/<%= env %>/dist.min.js': 'dist/<%= env %>/dist.js'
        }
      }
    },

    // Tests.
    simplemocha: {// Server-side.
      options: {
        reporter : 'spec',
        timeout  : 30000
      },
      all: { src: [ 'test/spec.js', 'test/**/*.spec.js' ] }
    },
    mocha: {// Client-side (headless).
      options: {
        log                     : true,// Enable console.log pass-through.
        reporter                : 'Spec',// Matches simplemocha.options.reporter.
        run                     : true,
        timeout                 : '<%= simplemocha.options.timeout %>',
        '--local-storage-quota' : 10 * 1024,// 10mb, to avoid quota-related errors.
        '--ssl-protocol'        : 'any'// Required by staging.
      },
      all: 'test/index.html'
    },
    karma: {// Client-side (browser).
      options: {
        configFile     : 'lib/karma.conf.js',
        browsers       : '<%= config.browsers %>',
        captureTimeout : 30000
      },
      continuous: { singleRun: true },
      unit: { background: true }
    },

    // Documentation.
    jsdoc: {
      all: {
        src: [
          'lib/jsdoc.md',
          '<%= clean.publish %>/<%= pkg.name %>-<%= build %>-<%= pkg.version %>.js'
        ],
        options: {
          configure   : 'lib/jsdoc.json',
          destination : '<%= clean.publish %>/jsdoc/<%= build %>',
          'private'   : false// Omit private members from documentation.
        }
      }
    },

    // Copying.
    copy: {
      // Copy build and config, used for testing purposes.
      intermediate: {
        options: {
          processContent: function(content, srcpath) {
            if('config.json' === srcpath) {
              // Export config adapted to current environment.
              return 'global.config = ' + content + '[\'' + env + '\'];';
            }
            return content;
          }
        },
        files: [{
          dest : '<%= clean.intermediate %>/kinvey.js',
          src  : '<%= concat.build.dest %>'
        }, {
          dest : '<%= clean.intermediate %>/config.js',
          src  : 'config.json'
        }]
      },

      // Copy build and packed version of the library, as well as docs.
      publish: {
        files: [{
          dest : '<%= clean.publish %>/<%= pkg.name %>-<%= build %>-<%= pkg.version %>.js',
          src  : '<%= concat.build.dest %>'
        }, {
          dest : '<%= clean.publish %>/<%= pkg.name %>-<%= build %>-<%= pkg.version %>.min.js',
          src  : '<%= concat.pack.dest %>'
        }]
      }
    },

    // Server and watch utils.
    server: {
      options: { keepalive: true },
      all: { },
      doc: {
        options: { base: '<%= jsdoc.all.options.destination %>' }// Overrides.
      },
      titanium: {
        options: {
          middleware: function() {
            grunt.log.writeln('Waiting for the Titanium test report…\n'.cyan);
            return [ require('./lib/titanium.grunt.js') ];
          },
          port: 9001
        }
      }
    },
    watch: {
      all: {
        files : ['src/**/*', 'test/**/*'],
        tasks : ['cleanup', 'jshint', 'build', 'test', 'karma:unit:run']
      }
    },

    // Clean.
    clean: {
      development  : 'dist/development',
      staging      : 'dist/staging',
      production   : 'dist/production',
      intermediate : 'dist/intermediate',
      publish      : 'dist/publish'
    },

    // Custom operations.
    shell: {
      deploy: {
        command: Object.keys(config.build).map(function(library) {
          var args = grunt.option.flags().concat(// Preserve flags.
            '--build=' + library,
            '--env=production'
          );
          return 'grunt build publish ' + args.join(' ');
        }).join('&&'),
        options: {
          failOnError : true,
          stdout      : true,
          stderr      : true
        }
      },
      tiplatformconnect: {
        command: [
          'rm -rf ./jsOAuth',
          'git clone git://github.com/bytespider/jsOAuth.git        ./jsOAuth',
          'make --directory ./jsOAuth',
          './uglify-js/bin/uglifyjs ./kinvey-tiplatformconnect/Resources/google.js ' +
            './kinvey-tiplatformconnect/Resources/linkedin.js ' +
            './kinvey-tiplatformconnect/Resources/twitter.js ' +
            '-cmo ./kinvey-tiplatformconnect/dist.js'
        ].join('&&'),
        options: {
          execOptions : { cwd: 'node_modules' },
          failOnError : true,
          stdout      : true,
          stderr      : true
        }
      },
      promiscuous: {
        command     : 'node build/build.js',
        options     : {
          execOptions : { cwd: 'node_modules/promiscuous' },
          failOnError : true
        }
      }
    }
  });

  // Top-level tasks.
  // ----------------

  // Default task.
  grunt.registerTask('default', ['cleanup', 'audit', 'build', 'test', 'publish']);
  grunt.registerTask('sandbox', ['cleanup', 'audit', 'build', 'publish']);
  grunt.registerTask('deploy',  ['clean:publish', 'audit', 'shell:deploy']);

  // Main tasks.
  grunt.registerTask('audit', [ 'jsonlint', 'jshint' ]);
  grunt.registerTask('build', [
    'concat:dist', 'jsbeautifier', 'uglify', 'jshint:dist', 'externals',
    'concat:dependencies', 'concat:build', 'concat:pack', 'copy:intermediate'
  ]);
  grunt.registerTask('live',    ['karma:unit', 'watch']);
  grunt.registerTask('cleanup', ['clean:' + env, 'clean:intermediate']);

  // Test tasks (build-dependent).
  grunt.registerTask('test',          ['test:' + build]);

  // Requires Angular.js >=1.2.3.
  // @see https://github.com/angular/angular.js/pull/4514
  grunt.registerTask('test:angular',  [/*'client-tests'*/]);

  grunt.registerTask('test:backbone', ['client-tests']);
  grunt.registerTask('test:html5',    ['client-tests']);
  grunt.registerTask('test:nodejs',   ['server-tests']);
  grunt.registerTask('test:phonegap', []);
  grunt.registerTask('test:phonegap-crypto', []);
  grunt.registerTask('test:titanium', ['server:titanium']);
  grunt.registerTask('browser-tests', ['karma:continuous']);

  grunt.registerTask('server-tests',  ['simplemocha']);
  grunt.registerTask('client-tests',  ['mocha']);

  // Publish task (environment-dependent).
  grunt.registerTask('publish',             ['publish:' + env]);
  grunt.registerTask('publish:development', []);// Never publish development ..
  grunt.registerTask('publish:staging',     []);// .. and staging packages.
  grunt.registerTask('publish:production',  ['copy:publish', 'jsdoc']);

  // Custom tasks.
  // -------------

  // Task to compile external libaries.
  grunt.registerTask('externals',          ['shell:promiscuous', 'externals:' + build]);
  grunt.registerTask('externals:angular',  []);
  grunt.registerTask('externals:backbone', []);
  grunt.registerTask('externals:html5',    []);
  grunt.registerTask('externals:nodejs',   []);
  grunt.registerTask('externals:phonegap', []);
  grunt.registerTask('externals:phonegap-crypto', []);
  grunt.registerTask('externals:titanium', ['shell:tiplatformconnect']);
};
