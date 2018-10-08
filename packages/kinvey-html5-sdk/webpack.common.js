const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const pkg = require('./package.json');

const config = {
  entry: {},
  plugins: [
    new CleanWebpackPlugin(['bundle']),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'bundle'),
    libraryTarget: 'umd',
    library: 'Kinvey'
  }
};

config.entry[pkg.name] = path.resolve(__dirname, pkg.main);
module.exports = config;
