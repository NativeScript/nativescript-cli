const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const fs = require('fs');
const mangleExcludes = require('./mangle-excludes');
const pkg = require('./package.json');

module.exports = (env = {}) => {
  const platform = getPlatform(env);
  const extensions = getExtensions(platform);
  const rules = getRules();
  const plugins = getPlugins(env, platform);
  let bundleName = pkg.name;

  const config = {
    entry: {},
    output: {
      filename: "[name].js",
      pathinfo: true,
      path: path.join(__dirname, 'dist'),
      libraryTarget: "commonjs2",
      library: 'Kinvey'
    },
    externals: {
      'globals': 'globals',
      'nativescript-push-notifications': 'nativescript-push-notifications',
      'nativescript-sqlite': 'nativescript-sqlite',
      'tns-core-modules/application': 'application',
      'http': 'http',
      'tns-core-modules/http': 'http',
      'tns-core-modules/file-system': 'file-system',
      'tns-core-modules/ui/frame': 'ui/frame',
      'tns-core-modules/ui/page': 'ui/page',
      'tns-core-modules/ui/layouts/grid-layout': 'ui/layouts/grid-layout',
      'tns-core-modules/ui/layouts/stack-layout': 'ui/layouts/stack-layout',
      'tns-core-modules/ui/web-view': 'ui/web-view',
      'tns-core-modules/platform': 'platform',
      'tns-core-modules/utils/utils': 'utils/utils'
    },
    resolve: {
      extensions: extensions
    },
    node: {
      // Disable node shims that conflict with NativeScript
      http: false,
      timers: false,
      setImmediate: false,
      fs: 'empty',
    },
    module: {
      rules: rules
    },
    plugins: plugins,
    devtool: 'source-map'
  };

  if (env.s3) {
    bundleName = `${bundleName}-${pkg.version}`;
  }

  bundleName = `${bundleName}.${platform}`;

  config.entry[bundleName] = './src/index.ts';
  return config;
};

function getPlatform(env) {
  if (env) {
    if (env.android) return 'android';
    if (env.ios) return 'ios';
  }

  throw new Error('You need to provide a target platform!');
}

function getExtensions(platform) {
  return Object.freeze([
    `.${platform}.ts`,
    `.${platform}.js`,
    '.ts',
    '.js'
  ]);
}

function getRules() {
  return [
    {
      test: /\.ts$/,
      loaders: [
        {
          loader: 'ts-loader',
          options: { transpileOnly: true }
        }
      ]
    },
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

function getPlugins(env, platform) {
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
      { from: '.travis.yml' },
      { from: path.join(__dirname, '../../src/kinvey.d.ts') },
      { from: 'platforms/**/*' },
      { from: 'LICENSE' },
      { from: 'README.md' },
    ]),

    new webpack.NormalModuleReplacementPlugin(/^pubnub$/, (resource) => {
      resource.request = resource.request.replace(/^pubnub$/, 'pubnub/lib/nativescript/index.js');
    })
  ];

  if (env.uglify) {
    // Work around an Android issue by setting compress = false
    const compress = platform !== 'android';
    plugins.push(
      new UglifyJSPlugin({
        sourceMap: true,
        uglifyOptions: {
          mangle: { reserved: mangleExcludes },
          compress,
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
