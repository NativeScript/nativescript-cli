const CleanWebpackPlugin = require('clean-webpack-plugin');
const helpers = require('./helpers');

module.exports = {
  entry: {
    main: './src/angular.ts'
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  plugins: [
    new CleanWebpackPlugin(helpers.root('dist'), { root: helpers.root(), verbose: true })
  ]
};