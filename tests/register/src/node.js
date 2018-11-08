import { addHook } from 'pirates';

export const DEFAULT_EXTENSIONS = Object.freeze([
  '.js',
  '.jsx',
  '.es6',
  '.es',
  '.mjs',
]);

let compiling = false;
let piratesRevert = null;

function compile(code) {
  return code.replace('__SDK__', process.env.SDK);
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

export default function register(opts = {}) {
  hookExtensions(opts.extensions || DEFAULT_EXTENSIONS);
}

register();
