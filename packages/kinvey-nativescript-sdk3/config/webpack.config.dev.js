const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const helpers = require('./helpers');

module.exports = webpackMerge(commonConfig, {
  mode: 'development',

  devtool: 'cheap-module-eval-source-map',

  output: {
    path: helpers.root('dist'),
    publicPath: '/',
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js'
  },

  optimization: {
    noEmitOnErrors: true
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: helpers.root('tsconfig.json')
            }
          }
        ],
        exclude: [/node_modules/]
      }
    ]
  }
});