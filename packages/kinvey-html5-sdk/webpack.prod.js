// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// eslint-disable-next-line import/no-extraneous-dependencies
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: `[name]-${pkg.version}.min.js`
  },
  performance: {
    maxEntrypointSize: 400000,
    maxAssetSize: 400000
  },
  // plugins: [
  //   new BundleAnalyzerPlugin()
  // ]
});
