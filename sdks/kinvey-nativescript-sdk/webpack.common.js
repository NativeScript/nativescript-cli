const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const CleanWebpackPlugin = require('clean-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');
const pkg = require('./package.json');

const BANNER = `
/**
 * ${pkg.name} - ${pkg.description}
 * @version ${pkg.version}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */
`;

const config = {
  entry: {
    'kinvey-nativescript-sdk': path.resolve(__dirname, 'lib', 'index.js')
  },
  externals: [
    {
      'nativescript-sqlite': 'nativescript-sqlite',
      'tns-core-modules/http': 'tns-core-modules/http'
    }
  ],
  node: {
    url: true
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Kinvey'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.BannerPlugin({
      banner: BANNER,
      raw: true
    })
  ]
};

module.exports = config;
