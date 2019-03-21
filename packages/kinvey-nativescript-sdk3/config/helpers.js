const path = require('path');

const rootPath = path.resolve(__dirname, '..');

function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [rootPath].concat(args));
}

function environment() {
  return (process.env.NODE_ENV || 'development').trim();
}

function isProd() {
  return environment() === 'production'
}

function isDev() {
  return !isProd();
}

exports.root = root;
exports.environment = environment;
exports.isProd = isProd;
exports.isDev = isDev;