const webpackMerge = require('webpack-merge');
const ngw = require('@ngtools/webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const commonConfig = require('./webpack.config.common');
const helpers = require('./helpers');

module.exports = webpackMerge(commonConfig, {
  mode: 'production',

  output: {
    path: helpers.root('dist'),
    publicPath: '/',
    filename: '[hash].js',
    chunkFilename: '[id].[hash].chunk.js'
  },

  optimization: {
    noEmitOnErrors: true,
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: 'single',
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true
      })
    ]
  },

  module: {
    rules: [
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        loader: '@ngtools/webpack'
      }
    ]
  },

  plugins: [
    new ngw.AngularCompilerPlugin({
      tsConfigPath: helpers.root('tsconfig.aot.json'),
      entryModule: helpers.root('src', 'lib', 'kinvey.module#KinveyModule')
    })
  ]
});