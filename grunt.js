/*global config:true, task:true*/
config.init({
  pkg: '<json:package.json>',
  meta: {
    banner: '/*!\n' +
      ' * Copyright (c) <%= template.today("yyyy") %> Kinvey, Inc. All rights reserved.\n' +
      ' *\n' +
      ' * Licensed to Kinvey, Inc. under one or more contributor\n' +
      ' * license agreements.  See the NOTICE file distributed with\n' +
      ' * this work for additional information regarding copyright\n' +
      ' * ownership.  Kinvey, Inc. licenses this file to you under the\n' +
      ' * Apache License, Version 2.0 (the "License"); you may not\n' +
      ' * use this file except in compliance with the License.  You\n' +
      ' * may obtain a copy of the License at\n' +
      ' *\n' +
      ' *         http://www.apache.org/licenses/LICENSE-2.0\n' +
      ' *\n' +
      ' * Unless required by applicable law or agreed to in writing,\n' +
      ' * software distributed under the License is distributed on an\n' +
      ' * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY\n' +
      ' * KIND, either express or implied.  See the License for the\n' +
      ' * specific language governing permissions and limitations\n' +
      ' * under the License.\n' +
      ' */'
  },
  concat: {
    'dist/kinvey.js': ['<banner>', 'src/intro.txt', 'src/Kinvey.js', 'src/query/Query.js', 'src/query/JsonQueryBuilder.js', 'src/query/SimpleQuery.js', 'src/net/Net.js', 'lib/net/Http.js', 'src/Entity.js', 'src/Collection.js', 'src/User.js', 'src/UserCollection.js', 'src/outro.txt']
  },
  min: {
    'dist/kinvey.min.js': ['<banner>', 'dist/kinvey.js']
  },
  test: {
    files: ['test/Kinvey.js']
  },
  lint: {
    beforeconcat: ['grunt.js', 'src/**/*.js', 'test/Kinvey.js'],//, 'test/**/*.js'
    afterconcat:  ['dist/kinvey.js']
  },
  watch: {
    files: '<config:lint.files>',
    tasks: 'lint test'
  },
  jshint: {
    options: {
      curly: true,
      eqeqeq: true,
      immed: true,
      latedef: true,
      newcap: true,
      noarg: true,
      undef: true,
      boss: true,
      eqnull: true,
      expr: true
    },
    globals: {
      exports: true,
      window: true,//should be removed at some point
      
      Kinvey: true,
      extend: true,
      inherits: true,
      currentUser: true
    }
  },
  uglify: {}
});

// Default task.
task.registerTask('default', 'lint:beforeconcat concat test lint:afterconcat min');