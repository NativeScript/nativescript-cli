const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  // Source maps support ('inline-source-map' also works)
  devtool: 'source-map',

  plugins: [
    new Dotenv({
      path: path.join(__dirname, '.env'),
      systemvars: true
    })
  ]
};
