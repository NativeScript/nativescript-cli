module.exports = function (api) {
  api.cache(true);

  const presets = [
    ['@babel/env', {
      corejs: '3',
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = [
    'transform-inline-environment-variables'
  ];

  return {
    presets,
    plugins
  };
}
