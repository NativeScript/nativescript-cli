const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: '__SDK__',
          replace: path.resolve(__dirname, '..', '..', 'packages', 'kinvey-html5-sdk')
        }
      }
    ]
  },
});
