/**
 * Gruntfile
 * 
 */
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Configuration.
    config: '<json:config.json>',
    pkg: '<json:package.json>',

    // Build configuration.
    dir: {// Directories.
      apidoc: 'docs/api',
      dist: 'dist',
      src: 'src',
      test: 'test'
    },
    sdk: {
      appcloud: '<%= pkg.name %>-app-cloud-<%= pkg.version %>',// App Cloud dist filename.'
      html5: '<%= pkg.name %>-js-<%= pkg.version %>',// HTML5 dist filename.
      node: '<%= pkg.name %>-nodejs-<%= pkg.version %>',// node dist filename.
      phonegap: '<%= pkg.name %>-phonegap-<%= pkg.version %>',// phonegap dist filename.
      titanium: '<%= pkg.name %>-titanium-<%= pkg.version %>'// titanium dist filename.
    },

    // Banner.
    meta: {
      banner: [
        '/*!',
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> Kinvey, Inc. All rights reserved.',
        ' *',
        ' * Licensed to Kinvey, Inc. under one or more contributor',
        ' * license agreements.  See the NOTICE file distributed with',
        ' * this work for additional information regarding copyright',
        ' * ownership.  Kinvey, Inc. licenses this file to you under the',
        ' * Apache License, Version 2.0 (the "License"); you may not',
        ' * use this file except in compliance with the License.  You',
        ' * may obtain a copy of the License at',
        ' *',
        ' *         http://www.apache.org/licenses/LICENSE-2.0',
        ' *',
        ' * Unless required by applicable law or agreed to in writing,',
        ' * software distributed under the License is distributed on an',
        ' * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY',
        ' * KIND, either express or implied.  See the License for the',
        ' * specific language governing permissions and limitations',
        ' * under the License.',
        ' */'
      ].join("\n")
    },

    // Lint task.
    lint: {
      dist: '<%= dir.dist %>/**/*[!.min].js',
      grunt: ['grunt.js', 'lib/**/*.js'],
      src: '<%= dir.src %>/**/*[!.min].js',
      test: '<%= dir.test %>/**/*[!.min].js'
    },
    // @link http://www.jshint.com/options/
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        newcap: true,
        noarg: true,
        undef: true,
        strict: false,
        eqnull: true,
        expr: true,
        browser: true,
        node: true
      },

      // Task globals.
      dist: {
        globals: { Titanium: true }
      },
      src: {
        globals: {
          Base: true,
          bind: true,
          Database: true,
          Kinvey: true,
          merge: true,
          Storage: true,
          Titanium: true,
          Xhr: true
        }
      },
      test: {
        globals: {
          callback: true,
          COLLECTION_UNDER_TEST: true,
          Kinvey: true,
          MASTER_SECRET: true,

          after: true,
          afterEach: true,
          before: true,
          beforeEach: true,
          describe: true,
          it: true,
          mocha: true
        }
      }
    },

    // Specify concatenation task.
    concat: {
      appcloud: {
        src: [
          '<banner>',
          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/util/Storage.js',
          '<%= dir.src %>/util/Xhr.AppCloud.js',

          '<%= dir.src %>/Kinvey.js',
          '<%= dir.src %>/Error.js',
          '<%= dir.src %>/Entity.js',
          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/Metadata.js',

          '<%= dir.src %>/query/Query.js',
          '<%= dir.src %>/query/MongoBuilder.js',
          '<%= dir.src %>/aggregation/Aggregation.js',
          '<%= dir.src %>/aggregation/MongoBuilder.js',

          '<%= dir.src %>/store/Store.browser.js',
          '<%= dir.src %>/store/Rpc.js',
          '<%= dir.src %>/store/AppData.js',
          '<%= dir.src %>/store/Database.js',
          '<%= dir.src %>/store/Cached.js',
          '<%= dir.src %>/store/Offline.js',
          '<%= dir.src %>/store/Sync.js',

          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk.appcloud %>.js'
      },
      html5: {
        src: [
          '<banner>',
          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/util/Storage.js',
          '<%= dir.src %>/util/Xhr.js',

          '<%= dir.src %>/Kinvey.js',
          '<%= dir.src %>/Error.js',
          '<%= dir.src %>/Entity.js',
          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/Metadata.js',

          '<%= dir.src %>/query/Query.js',
          '<%= dir.src %>/query/MongoBuilder.js',
          '<%= dir.src %>/aggregation/Aggregation.js',
          '<%= dir.src %>/aggregation/MongoBuilder.js',

          '<%= dir.src %>/store/Store.browser.js',
          '<%= dir.src %>/store/Rpc.js',
          '<%= dir.src %>/store/AppData.js',
          '<%= dir.src %>/store/Database.js',
          '<%= dir.src %>/store/Cached.js',
          '<%= dir.src %>/store/Offline.js',
          '<%= dir.src %>/store/Sync.js',

          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk.html5 %>.js'
      },
      node: {
        src: [
          '<banner>',
          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/util/Storage.node.js',
          '<%= dir.src %>/util/Xhr.node.js',

          '<%= dir.src %>/Kinvey.js',
          '<%= dir.src %>/Error.js',
          '<%= dir.src %>/Entity.js',
          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/Metadata.js',
          '<%= dir.src %>/Resource.js',

          '<%= dir.src %>/query/Query.js',
          '<%= dir.src %>/query/MongoBuilder.js',
          '<%= dir.src %>/aggregation/Aggregation.js',
          '<%= dir.src %>/aggregation/MongoBuilder.js',

          '<%= dir.src %>/store/Store.js',
          '<%= dir.src %>/store/Rpc.js',
          '<%= dir.src %>/store/AppData.js',
          '<%= dir.src %>/store/Blob.js',

          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk.node %>.js'
      },
      phonegap: {
        src: [
          '<banner>',

          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/util/Storage.js',
          '<%= dir.src %>/util/Xhr.js',

          '<%= dir.src %>/Kinvey.js',
          '<%= dir.src %>/Error.js',
          '<%= dir.src %>/Entity.js',
          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/Metadata.js',
          '<%= dir.src %>/Resource.js',

          '<%= dir.src %>/query/Query.js',
          '<%= dir.src %>/query/MongoBuilder.js',
          '<%= dir.src %>/aggregation/Aggregation.js',
          '<%= dir.src %>/aggregation/MongoBuilder.js',

          '<%= dir.src %>/store/Store.phonegap.js',
          '<%= dir.src %>/store/Rpc.js',
          '<%= dir.src %>/store/AppData.js',
          '<%= dir.src %>/store/Blob.js',
          '<%= dir.src %>/store/Database.js',
          '<%= dir.src %>/store/Cached.js',
          '<%= dir.src %>/store/Offline.js',
          '<%= dir.src %>/store/Sync.js',

          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk.phonegap %>.js'
      },
      titanium: {
        src: [
          '<banner>',
          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/util/Storage.titanium.js',
          '<%= dir.src %>/util/Xhr.titanium.js',

          '<%= dir.src %>/Kinvey.js',
          '<%= dir.src %>/Error.js',
          '<%= dir.src %>/Entity.js',
          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/Metadata.js',
          '<%= dir.src %>/Resource.js',

          '<%= dir.src %>/query/Query.Titanium.js',
          '<%= dir.src %>/query/MongoBuilder.js',
          '<%= dir.src %>/aggregation/Aggregation.js',
          '<%= dir.src %>/aggregation/MongoBuilder.js',

          '<%= dir.src %>/store/Store.js',
          '<%= dir.src %>/store/Rpc.js',
          '<%= dir.src %>/store/AppData.js',
          '<%= dir.src %>/store/Blob.js',

          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk.titanium %>.js'
      }
    },

    // Strip task.
    strip: {
      concat: ['<%= dir.dist %>/**/*[!.min].js'],
      min: ['<%= dir.dist %>/**/*.min.js']
    },

    // Replace task.
    replace: {
      all: {
        src: '<%= dir.dist %>/**/*[!.min].js',
        dest: '<%= dir.dist %>'
      }
    },
    replacer: {
      variables: {
        host: '<%= config.development.host %>',
        version: '<%= pkg.version %>'
      }
    },

    // Mocha task.
    mocha: {
      test: {
        require: ['<%= dir.test %>/spec.js'],
        src: ['<%= dir.test %>/**/*.spec.js']
      }
    },
    mochaOptions: { timeout: 10000 },

    // Minification task.
    min: {
      appcloud: {
        src: ['<banner>', '<%= dir.dist %>/<%= sdk.appcloud %>.js'],
        dest: '<%= dir.dist %>/<%= sdk.appcloud %>.min.js'
      },
      html5: {
        src: ['<banner>', '<%= dir.dist %>/<%= sdk.html5 %>.js'],
        dest: '<%= dir.dist %>/<%= sdk.html5 %>.min.js'
      },
      phonegap: {
        src: ['<banner>', '<%= dir.dist %>/<%= sdk.phonegap %>.js'],
        dest: '<%= dir.dist %>/<%= sdk.phonegap %>.min.js'
      }
    },

    // JSDoc task.
    jsdoc: {
      appcloud: {
        src: '<%= dir.dist %>/<%= sdk.appcloud %>.js',
        dest: '<%= dir.apidoc %>/appcloud'
      },
      html5: {
        src: '<%= dir.dist %>/<%= sdk.html5 %>.js',
        dest: '<%= dir.apidoc %>/html5'
      },
      node: {
        src: '<%= dir.dist %>/<%= sdk.node %>.js',
        dest: '<%= dir.apidoc %>/nodejs'
      },
      phonegap: {
        src: '<%= dir.dist %>/<%= sdk.phonegap %>.js',
        dest: '<%= dir.apidoc %>/phonegap'
      },
      titanium: {
        src: '<%= dir.dist %>/<%= sdk.titanium %>.js',
        dest: '<%= dir.apidoc %>/titanium'
      }
    },

    // Watch task.
    watch: {
      grunt: {
        files: ['grunt.js', 'lib/**/*.js'],
        tasks: 'lint:grunt'
      },
      src: {
        files: '<%= dir.src %>/**/*.js',
        tasks: 'lint:src'
      },
      test: {
        files: '<%= dir.test %>/**/*.js',
        tasks: 'test'
      }
    },

    // Clean task.
    clean: { folder: ['<%= dir.dist %>', '<%= dir.apidoc %>'] },

    // Environment overrides.
    context: {
      production: {
        options: {
          replacer: {
            variables: { host: '<%= config.production.host %>' }
          }
        }
      }
    }
  });

  // Load external tasks.
  grunt.loadNpmTasks('grunt-context');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadTasks('lib/grunt/tasks');

  // Register composite tasks.
  grunt.registerTask('default', 'prepare build test minify');
  grunt.registerTask('production', 'context:production prepare build minify doc');
  grunt.registerTask('sandbox', 'prepare build minify');

  // Sub tasks.
  grunt.registerTask('prepare', 'lint:grunt');
  grunt.registerTask('build', 'lint:src concat strip:concat replace lint:dist');
  grunt.registerTask('minify', 'min strip:min');
  grunt.registerTask('test', 'lint:test mocha');
  grunt.registerTask('doc', 'jsdoc');
};