const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/api',
  output: {
    library: 'Kinvey',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    filename: 'lib.bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [{
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }],
  },
  externals: {
    '@babel/runtime':
  }
};
