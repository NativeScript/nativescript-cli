// Export configuration
module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    // Meta information
    dir: {//project directories
      apidoc: 'docs/api',
      dist: 'dist',
      src: 'src',
      test: 'test'
    },
    pkg: '<json:package.json>',
    sdk: '<%= pkg.name %>-<%= pkg.version %>',//dist base filename
    meta: {
      banner: [//sdk will be prefixed with this banner
        '/*!', ' * <%= sdk %>',
        ' *',
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

    // JSHint task
    lint: {
//      beforeconcat: ['grunt.js', 'lib/grunt/**/*.js', '<%= dir.src %>/**/*.js', '<%= dir.test %>/**/*.js' ],
      beforeconcat: ['grunt.js', 'lib/grunt/**/*.js', '<%= dir.src %>/**/*.js' ],
      afterconcat: [ '<%= dir.dist %>/<%= sdk %>.js' ]
    },
    jshint: {//http://www.jshint.com/options/
      options: {
        curly: true,//require { }
        eqeqeq: true,//=== instead of ==
        immed: true,//wrap IIFE in parentheses
        latedef: true,//variable declared before usage
        newcap: true,//capitalize class names
        noarg: true,//forbids arguments.calle(e/r)
        undef: true,//checks for undefined variables

        eqnull: true,//== allowed for undefined/null checking

        node: true//node environment
      }
    },

    // Concatenation task
    concat: {
      dist: {
        src: [
          '<banner>',
          '<%= dir.src %>/intro.txt',
          '<%= dir.src %>/Kinvey.js',
//          '<%= dir.src %>/query/Query.js',
//          '<%= dir.src %>/query/JsonQueryBuilder.js',
//          '<%= dir.src %>/query/SimpleQuery.js',
//          '<%= dir.src %>/net/Net.js',
//          '<%= dir.src %>/net/Http.js',
//          '<%= dir.src %>/Entity.js',
//          '<%= dir.src %>/Collection.js',
          '<%= dir.src %>/User.js',
//          '<%= dir.src %>/UserCollection.js',
          '<%= dir.src %>/outro.txt'
        ],
        dest: '<%= dir.dist %>/<%= sdk %>.js'
      }
    },

    // Replace task
    replace: {
      firstPass: {//remove IIFE from source files
        src: '<%= dir.dist %>/<%= sdk %>.js',
        find: /^\(function\(Kinvey\) \{|\}\(Kinvey\)\);$/gm
      },
      secondPass: {//remove gaps in newlines due to firstPass
        src: '<%= dir.dist %>/<%= sdk %>.js',
        find: /\n{3,}/g,
        replace: '\n\n'
      },
      thirdPass: {//remove newline below <banner>
        src: '<%= dir.dist %>/<%= sdk %>.js',
        find: /\n(\(function\(undefined\) \{)/g,
        replace: '$1'
      },

      reset: {//minification damages undefined argument, undo here 
        src: '<%= dir.dist %>/<%= sdk %>.min.js',
        find: /\(function\(a\)\{/g,
        replace: '(function(undefined){'
      }
    },

    // TODO create testing task

    // API generation task
    apidoc: {
      files: {
        src: ['<%= dir.dist %>/<%= sdk %>.js'],
        dest: '<%= dir.apidoc %>'
      }
    },

    // Minification task
    min: {
      dist: {
        src: [ '<banner>', '<%= dir.dist %>/<%= sdk %>.js' ],
        dest: '<%= dir.dist %>/<%= sdk %>.min.js'
      }
    },

    // Watch files
    watch: {
      files: '<config:lint.beforeconcat>',
      tasks: 'default'
    },

    // Clean task
    clean: {
      files: ['<%= dir.apidoc %>', '<%= dir.dist %>']
    }
  });

  // Load task plugins
  grunt.loadTasks('lib/grunt/tasks');

  // Register tasks
  grunt.registerTask('default', 'lint:beforeconcat concat replace lint:afterconcat apidoc min');

};