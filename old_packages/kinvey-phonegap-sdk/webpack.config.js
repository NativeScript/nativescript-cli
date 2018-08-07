const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const fs = require('fs');
const pkg = require('./package.json');

module.exports = (env = {}) => {
  let bundleName = pkg.name;

  const config = {
    entry: {},
    output: {
      filename: '[name].js',
      pathinfo: true,
      path: path.join(__dirname, 'dist'),
      libraryTarget: 'umd',
      library: 'Kinvey'
    },
    resolve: {
      extensions: ['.js', '.json']
    },
    devtool: 'source-map',
    module: {
      rules: getRules()
    },
    plugins: getPlugins(env)
  };

  if (env.s3) {
    bundleName = `${bundleName}-${pkg.version}`;
  }

  if (env.uglify) {
    bundleName = `${bundleName}.min`;
  }

  config.entry[bundleName] = './src/index.js';
  return config;
}

function getRules() {
  return [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          sourceMaps: true
        }
      }
    },
    {
      test: /\.json$/,
      loaders: [
        'json-loader'
      ]
    }
  ];
}

function getPlugins(env = {}) {
  const plugins = [
    // Copy assets to out dir. Add your own globs as needed.
    new CopyWebpackPlugin([
      {
        from: 'package.json',
        transform: (content) => {
          const pkg = JSON.parse(content.toString('utf8'));
          delete pkg.private;
          delete pkg.devDependencies;
          delete pkg.scripts;
          return new Buffer(JSON.stringify(pkg, null, 2));
        }
      },
      { from: 'bower.json' },
      { from: '.travis.yml' },
      { from: 'LICENSE' },
      { from: 'README.md' }
    ])
  ];

  if (env.uglify) {
    plugins.push(
      new UglifyJSPlugin({
        sourceMap: true,
        uglifyOptions: {
          output: {
            comments: false
          }
        }
      })
    );
  }

  plugins.push(
    new webpack.BannerPlugin({
      banner: `
/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @author ${pkg.author}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 */
      `.trim(),
      raw: true,
      entryOnly: true
    })
  );

  return plugins;
}
