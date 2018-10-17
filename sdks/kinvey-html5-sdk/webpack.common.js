const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
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
  entry: {},
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.BannerPlugin({
      banner: BANNER,
      raw: true
    })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Kinvey'
  }
};

config.entry[pkg.name] = path.resolve(__dirname, pkg.main);
module.exports = config;
