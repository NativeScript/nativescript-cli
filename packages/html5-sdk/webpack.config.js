const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const pkg = require('./package.json');

const BANNER = `
/**
 * ${pkg.name} - ${pkg.description}
 * @version ${pkg.version}
 * @author ${pkg.author.name}
 * @license ${pkg.license}
 */
`;

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, pkg.main),
  output: {
    filename: `${pkg.name}-${pkg.version}.js`,
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'Kinvey'
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.BannerPlugin({
      banner: BANNER,
      raw: true
    })
  ],
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
};
