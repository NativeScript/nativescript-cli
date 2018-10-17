const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  performance: {
    maxEntrypointSize: 400000,
    maxAssetSize: 400000
  },
  plugins: [
    new BundleAnalyzerPlugin()
  ]
});
