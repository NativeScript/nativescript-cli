const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// eslint-disable-next-line import/no-extraneous-dependencies
const { addHook } = require('pirates');

const DEFAULT_EXTENSIONS = Object.freeze([
  '.js',
  '.jsx',
  '.es6',
  '.es',
  '.mjs',
]);

let compiling = false;
let piratesRevert = null;

function compile(code) {
  return code.replace('__SDK__', path.resolve(__dirname, '..', '..', 'packages', 'kinvey-node-sdk'));
}

function compileHook(code, filename) {
  if (compiling) return code;

  try {
    compiling = true;
    return compile(code, filename);
  } finally {
    compiling = false;
  }
}

function hookExtensions(exts) {
  if (piratesRevert) piratesRevert();
  piratesRevert = addHook(compileHook, { exts, ignoreNodeModules: false });
}

function register(opts = {}) {
  hookExtensions(opts.extensions || DEFAULT_EXTENSIONS);
}

register();

// eslint-disable-next-line func-names
exports = module.exports = function (...args) {
  return register(...args);
};
exports.__esModule = true;
Object.assign(exports, { DEFAULT_EXTENSIONS, default: register });
