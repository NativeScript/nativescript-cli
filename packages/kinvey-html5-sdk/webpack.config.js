const path = require('path');
const pkg = require('./package.json');

const config = {
  devtool: 'cheap-source-map',
  entry: {},
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Kinvey'
  },
  mode: 'development',
  node: {
    fs: 'empty'
  }
};

config.entry[pkg.name] = path.join(__dirname, pkg.main);
module.exports = config;
