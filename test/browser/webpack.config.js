/* eslint-disable */
var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname),
  entry: ['./tests/index.js'],
  module: {
    loaders: [
      { test: /\.js$/, exclude: /(node_modules|bower_components)/, loader: 'babel' },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  output: {
    filename: 'tests.js',
    path: path.join(__dirname, 'dist')
  }
};
