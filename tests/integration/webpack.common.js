const path = require('path');
const Dotenv = require('dotenv-webpack');

const DOT_ENV_FILE = path.resolve(__dirname, '.env');

module.exports = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  plugins: [
    new Dotenv({
      path: DOT_ENV_FILE,
      systemvars: true
    })
  ]
};
