const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const pkg = require('./package.json');

const config = {
  entry: {},
  plugins: [
    new CleanWebpackPlugin(['dist']),
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
