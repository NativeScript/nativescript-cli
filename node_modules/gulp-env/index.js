'use strict';

var fs = require('fs');
var path = require('path');
var ini = require('ini');
var through2 = require('through2');
var hasOwn = Object.prototype.hasOwnProperty;
var exts = require.extensions;

function extend(dest, src) {
  for (var prop in src) {
    if (hasOwn.call(src, prop)) {
      dest[prop] = src[prop];
    }
  }
}

// Custom types...it should be easy to
var types = {
  '.ini': ini.parse,
  '.json': JSON.parse,
};

// Copied from Node.js core.
function stripBOM(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

function bind(handler) {
  return function (file) {
    try {
      return handler(stripBOM(fs.readFileSync(file, 'utf8')));
    } catch (e) {
      e.message = file + ': ' + e.message;
      throw e;
    }
  };
}

module.exports = env;
function env(options) {
  var vars = {};
  var added = false;

  if (typeof options !== 'object') {
    options = {file: options + ''};
  }

  if (options.file) {
    var file = path.resolve(options.file);
    var type = options.type || path.extname(file);

    if (type && type[0] !== '.') {
      type = '.' + type;
    }

    var handler = null;

    if (options.handler) {
      handler = bind(options.handler);
    } else if (!type) {
      handler = require;
    } else if (types[type]) {
      handler = bind(types[type]);
    } else if (exts[type]) {
      handler = require;
    } else {
      throw new TypeError('gulp-env: Unknown type: ' + type);
    }

    extend(vars, handler(file));
    added = true;
  }

  if (options.vars) {
    if (vars == null) {
      extend(vars, options.vars);
    } else {
      extend(vars, options.vars);
    }
    added = true;
  }

  return set(added ? vars : null);
};

function noopPipe(chunk, enc, cb) {
  cb(null, chunk);
}

function noopFlush(cb) {
  cb()
}

function defaultRestore() {
  return false;
}

function once(f) {
  var reference = function () {
    f();
    reference = noopFlush;
    return reference.apply(this, arguments);
  };
  return reference;
}

function makeOld(vars) {
  var old = {};
  for (var i in vars) {
    if (hasOwn.call(vars, i) && hasOwn.call(process.env, i)) {
      old[i] = process.env[i];
    }
  }
  return old;
}

function restoreOld(vars, old, force) {
  var res = false;
  for (var i in vars) {
    if (hasOwn.call(vars, i)) {
      if (force) {
        if (hasOwn.call(old, i)) {
          process.env[i] = old[i];
          res = true;
        } else {
          delete process.env[i];
        }
      } else if (process.env[i] === '' + vars[i]) {
        if (hasOwn.call(old, i)) {
          process.env[i] = old[i];
          res = true;
        } else {
          delete process.env[i];
        }
      }
    }
  }
  return res;
}

env.set = set;
function set(vars) {
  var ret = through2.obj();

  if (vars != null) {
    var old = makeOld(vars);
    extend(process.env, vars);
    var restore = ret.restore = restoreOld.bind(null, vars, old);

    ret.reset = through2.obj(noopPipe, once(restore));
    ret.reset.force = through2.obj(noopPipe, once(restore.bind(null, true)));
  }

  return ret;
}
