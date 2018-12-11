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
          replace: 'kinvey-html5-sdk',
        }
      }
    ]
  },
});
