'use strict';

exports.__esModule = true;
exports.CASE_SENSITIVE_FS = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.relative = relative;
exports.default = resolve;

require('es6-symbol/implement');

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _crypto = require('crypto');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CASE_SENSITIVE_FS = exports.CASE_SENSITIVE_FS = !_fs2.default.existsSync((0, _path.join)(__dirname, 'reSOLVE.js'));

var fileExistsCache = new _es6Map2.default();

function cachePath(cacheKey, result) {
  fileExistsCache.set(cacheKey, { result: result, lastSeen: Date.now() });
}

function checkCache(cacheKey, _ref) {
  var lifetime = _ref.lifetime;

  if (fileExistsCache.has(cacheKey)) {
    var _fileExistsCache$get = fileExistsCache.get(cacheKey);

    var result = _fileExistsCache$get.result;
    var lastSeen = _fileExistsCache$get.lastSeen;
    // check fresness

    if (Date.now() - lastSeen < lifetime * 1000) return result;
  }
  // cache miss
  return undefined;
}

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath, cacheSettings) {
  // don't care if the FS is case-sensitive
  if (CASE_SENSITIVE_FS) return true;

  // null means it resolved to a builtin
  if (filepath === null) return true;

  var dir = (0, _path.dirname)(filepath);

  var result = checkCache(filepath, cacheSettings);
  if (result != null) return result;

  // base case
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/i.test(dir)) {
    result = true;
  } else {
    var filenames = _fs2.default.readdirSync(dir);
    if (filenames.indexOf((0, _path.basename)(filepath)) === -1) {
      result = false;
    } else {
      result = fileExistsWithCaseSync(dir, cacheSettings);
    }
  }
  cachePath(filepath, result);
  return result;
}

function relative(modulePath, sourceFile, settings) {

  var sourceDir = (0, _path.dirname)(sourceFile),
      cacheKey = sourceDir + hashObject(settings) + modulePath;

  var cacheSettings = (0, _objectAssign2.default)({
    lifetime: 30 }, // seconds
  settings['import/cache']);

  // parse infinity
  if (cacheSettings.lifetime === '∞' || cacheSettings.lifetime === 'Infinity') {
    cacheSettings.lifetime = Infinity;
  }

  var cachedPath = checkCache(cacheKey, cacheSettings);
  if (cachedPath !== undefined) return cachedPath;

  function cache(path) {
    cachePath(cacheKey, path);
    return path;
  }

  function withResolver(resolver, config) {

    function v1() {
      try {
        var path = resolver.resolveImport(modulePath, sourceFile, config);
        if (path === undefined) return { found: false };
        return { found: true, path: path };
      } catch (err) {
        return { found: false };
      }
    }

    function v2() {
      return resolver.resolve(modulePath, sourceFile, config);
    }

    switch (resolver.interfaceVersion) {
      case 2:
        return v2();

      default:
      case 1:
        return v1();
    }
  }

  var configResolvers = settings['import/resolver'] || { 'node': settings['import/resolve'] }; // backward compatibility

  var resolvers = resolverReducer(configResolvers, new _es6Map2.default());

  for (var _iterator = resolvers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref2;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref2 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref2 = _i.value;
    }

    var _ref3 = _ref2;
    var name = _ref3[0];
    var config = _ref3[1];

    var resolver = requireResolver(name);

    var _withResolver = withResolver(resolver, config);

    var fullPath = _withResolver.path;
    var found = _withResolver.found;

    // resolvers imply file existence, this double-check just ensures the case matches

    if (found && !fileExistsWithCaseSync(fullPath, cacheSettings)) {
      // reject resolved path
      fullPath = undefined;
    }

    if (found) return cache(fullPath);
  }

  return cache(undefined);
}

function resolverReducer(resolvers, map) {
  if (resolvers instanceof Array) {
    resolvers.forEach(function (r) {
      return resolverReducer(r, map);
    });
    return map;
  }

  if (typeof resolvers === 'string') {
    map.set(resolvers, null);
    return map;
  }

  if ((typeof resolvers === 'undefined' ? 'undefined' : _typeof(resolvers)) === 'object') {
    for (var key in resolvers) {
      map.set(key, resolvers[key]);
    }
    return map;
  }

  throw new Error('invalid resolver config');
}

function requireResolver(name) {
  try {
    return require('eslint-import-resolver-' + name);
  } catch (err) {
    throw new Error('unable to load resolver "' + name + '".');
  }
}

var erroredContexts = new _es6Set2.default();

/**
 * Given
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path;
 *                    null if package is core;
 *                    undefined if not found
 */
function resolve(p, context) {
  try {
    return relative(p, context.getFilename(), context.settings);
  } catch (err) {
    if (!erroredContexts.has(context)) {
      context.report({
        message: 'Resolve error: ' + err.message,
        loc: { line: 1, col: 0 }
      });
      erroredContexts.add(context);
    }
  }
}
resolve.relative = relative;

function hashObject(object) {
  var settingsShasum = (0, _crypto.createHash)('sha1');
  settingsShasum.update(JSON.stringify(object));
  return settingsShasum.digest('hex');
}
//# sourceMappingURL=data:application/json;base64,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R0FBSixDQUtFLE9BQU8sR0FBUCxFQUFZO0FBQ1osUUFBSSxDQUFDLGdCQUFnQixHQUFoQixDQUFvQixPQUFwQixDQUFELEVBQStCO0FBQ2pDLGNBQVEsTUFBUixDQUFlO0FBQ2IscUNBQTJCLElBQUksT0FBSjtBQUMzQixhQUFLLEVBQUUsTUFBTSxDQUFOLEVBQVMsS0FBSyxDQUFMLEVBQWhCO09BRkYsRUFEaUM7QUFLakMsc0JBQWdCLEdBQWhCLENBQW9CLE9BQXBCLEVBTGlDO0tBQW5DO0dBREE7Q0FOVztBQWdCZixRQUFRLFFBQVIsR0FBbUIsUUFBbkI7O0FBSUEsU0FBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCO0FBQzFCLE1BQU0saUJBQWlCLHdCQUFXLE1BQVgsQ0FBakIsQ0FEb0I7QUFFMUIsaUJBQWUsTUFBZixDQUFzQixLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXRCLEVBRjBCO0FBRzFCLFNBQU8sZUFBZSxNQUFmLENBQXNCLEtBQXRCLENBQVAsQ0FIMEI7Q0FBNUIiLCJmaWxlIjoiY29yZS9yZXNvbHZlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdlczYtc3ltYm9sL2ltcGxlbWVudCdcbmltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCdcbmltcG9ydCBTZXQgZnJvbSAnZXM2LXNldCdcbmltcG9ydCBhc3NpZ24gZnJvbSAnb2JqZWN0LWFzc2lnbidcblxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHsgZGlybmFtZSwgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJ1xuXG5leHBvcnQgY29uc3QgQ0FTRV9TRU5TSVRJVkVfRlMgPSAhZnMuZXhpc3RzU3luYyhqb2luKF9fZGlybmFtZSwgJ3JlU09MVkUuanMnKSlcblxuY29uc3QgZmlsZUV4aXN0c0NhY2hlID0gbmV3IE1hcCgpXG5cbmZ1bmN0aW9uIGNhY2hlUGF0aChjYWNoZUtleSwgcmVzdWx0KSB7XG4gIGZpbGVFeGlzdHNDYWNoZS5zZXQoY2FjaGVLZXksIHsgcmVzdWx0LCBsYXN0U2VlbjogRGF0ZS5ub3coKSB9KVxufVxuXG5mdW5jdGlvbiBjaGVja0NhY2hlKGNhY2hlS2V5LCB7IGxpZmV0aW1lIH0pIHtcbiAgaWYgKGZpbGVFeGlzdHNDYWNoZS5oYXMoY2FjaGVLZXkpKSB7XG4gICAgY29uc3QgeyByZXN1bHQsIGxhc3RTZWVuIH0gPSBmaWxlRXhpc3RzQ2FjaGUuZ2V0KGNhY2hlS2V5KVxuICAgIC8vIGNoZWNrIGZyZXNuZXNzXG4gICAgaWYgKERhdGUubm93KCkgLSBsYXN0U2VlbiA8IChsaWZldGltZSAqIDEwMDApKSByZXR1cm4gcmVzdWx0XG4gIH1cbiAgLy8gY2FjaGUgbWlzc1xuICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI3MzgyODM4XG5mdW5jdGlvbiBmaWxlRXhpc3RzV2l0aENhc2VTeW5jKGZpbGVwYXRoLCBjYWNoZVNldHRpbmdzKSB7XG4gIC8vIGRvbid0IGNhcmUgaWYgdGhlIEZTIGlzIGNhc2Utc2Vuc2l0aXZlXG4gIGlmIChDQVNFX1NFTlNJVElWRV9GUykgcmV0dXJuIHRydWVcblxuICAvLyBudWxsIG1lYW5zIGl0IHJlc29sdmVkIHRvIGEgYnVpbHRpblxuICBpZiAoZmlsZXBhdGggPT09IG51bGwpIHJldHVybiB0cnVlXG5cbiAgY29uc3QgZGlyID0gZGlybmFtZShmaWxlcGF0aClcblxuICBsZXQgcmVzdWx0ID0gY2hlY2tDYWNoZShmaWxlcGF0aCwgY2FjaGVTZXR0aW5ncylcbiAgaWYgKHJlc3VsdCAhPSBudWxsKSByZXR1cm4gcmVzdWx0XG5cbiAgLy8gYmFzZSBjYXNlXG4gIGlmIChkaXIgPT09ICcvJyB8fCBkaXIgPT09ICcuJyB8fCAvXltBLVpdOlxcXFwkL2kudGVzdChkaXIpKSB7XG4gICAgcmVzdWx0ID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGZpbGVuYW1lcyA9IGZzLnJlYWRkaXJTeW5jKGRpcilcbiAgICBpZiAoZmlsZW5hbWVzLmluZGV4T2YoYmFzZW5hbWUoZmlsZXBhdGgpKSA9PT0gLTEpIHtcbiAgICAgIHJlc3VsdCA9IGZhbHNlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGZpbGVFeGlzdHNXaXRoQ2FzZVN5bmMoZGlyLCBjYWNoZVNldHRpbmdzKVxuICAgIH1cbiAgfVxuICBjYWNoZVBhdGgoZmlsZXBhdGgsIHJlc3VsdClcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVsYXRpdmUobW9kdWxlUGF0aCwgc291cmNlRmlsZSwgc2V0dGluZ3MpIHtcblxuICBjb25zdCBzb3VyY2VEaXIgPSBkaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAsIGNhY2hlS2V5ID0gc291cmNlRGlyICsgaGFzaE9iamVjdChzZXR0aW5ncykgKyBtb2R1bGVQYXRoXG5cbiAgY29uc3QgY2FjaGVTZXR0aW5ncyA9IGFzc2lnbih7XG4gICAgbGlmZXRpbWU6IDMwLCAgLy8gc2Vjb25kc1xuICB9LCBzZXR0aW5nc1snaW1wb3J0L2NhY2hlJ10pXG5cbiAgLy8gcGFyc2UgaW5maW5pdHlcbiAgaWYgKGNhY2hlU2V0dGluZ3MubGlmZXRpbWUgPT09ICfiiJ4nIHx8IGNhY2hlU2V0dGluZ3MubGlmZXRpbWUgPT09ICdJbmZpbml0eScpIHtcbiAgICBjYWNoZVNldHRpbmdzLmxpZmV0aW1lID0gSW5maW5pdHlcbiAgfVxuXG4gIGNvbnN0IGNhY2hlZFBhdGggPSBjaGVja0NhY2hlKGNhY2hlS2V5LCBjYWNoZVNldHRpbmdzKVxuICBpZiAoY2FjaGVkUGF0aCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY2FjaGVkUGF0aFxuXG4gIGZ1bmN0aW9uIGNhY2hlKHBhdGgpIHtcbiAgICBjYWNoZVBhdGgoY2FjaGVLZXksIHBhdGgpXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxuXG4gIGZ1bmN0aW9uIHdpdGhSZXNvbHZlcihyZXNvbHZlciwgY29uZmlnKSB7XG5cbiAgICBmdW5jdGlvbiB2MSgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSByZXNvbHZlci5yZXNvbHZlSW1wb3J0KG1vZHVsZVBhdGgsIHNvdXJjZUZpbGUsIGNvbmZpZylcbiAgICAgICAgaWYgKHBhdGggPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsgZm91bmQ6IGZhbHNlIH1cbiAgICAgICAgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGggfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdjIoKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZXIucmVzb2x2ZShtb2R1bGVQYXRoLCBzb3VyY2VGaWxlLCBjb25maWcpXG4gICAgfVxuXG4gICAgc3dpdGNoIChyZXNvbHZlci5pbnRlcmZhY2VWZXJzaW9uKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiB2MigpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiB2MSgpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29uZmlnUmVzb2x2ZXJzID0gKHNldHRpbmdzWydpbXBvcnQvcmVzb2x2ZXInXVxuICAgIHx8IHsgJ25vZGUnOiBzZXR0aW5nc1snaW1wb3J0L3Jlc29sdmUnXSB9KSAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5cbiAgY29uc3QgcmVzb2x2ZXJzID0gcmVzb2x2ZXJSZWR1Y2VyKGNvbmZpZ1Jlc29sdmVycywgbmV3IE1hcCgpKVxuXG4gIGZvciAobGV0IFtuYW1lLCBjb25maWddIG9mIHJlc29sdmVycykge1xuICAgIGNvbnN0IHJlc29sdmVyID0gcmVxdWlyZVJlc29sdmVyKG5hbWUpXG5cbiAgICBsZXQgeyBwYXRoOiBmdWxsUGF0aCwgZm91bmQgfSA9IHdpdGhSZXNvbHZlcihyZXNvbHZlciwgY29uZmlnKVxuXG4gICAgLy8gcmVzb2x2ZXJzIGltcGx5IGZpbGUgZXhpc3RlbmNlLCB0aGlzIGRvdWJsZS1jaGVjayBqdXN0IGVuc3VyZXMgdGhlIGNhc2UgbWF0Y2hlc1xuICAgIGlmIChmb3VuZCAmJiAhZmlsZUV4aXN0c1dpdGhDYXNlU3luYyhmdWxsUGF0aCwgY2FjaGVTZXR0aW5ncykpIHtcbiAgICAgIC8vIHJlamVjdCByZXNvbHZlZCBwYXRoXG4gICAgICBmdWxsUGF0aCA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmIChmb3VuZCkgcmV0dXJuIGNhY2hlKGZ1bGxQYXRoKVxuICB9XG5cbiAgcmV0dXJuIGNhY2hlKHVuZGVmaW5lZClcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZXJSZWR1Y2VyKHJlc29sdmVycywgbWFwKSB7XG4gIGlmIChyZXNvbHZlcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHJlc29sdmVycy5mb3JFYWNoKHIgPT4gcmVzb2x2ZXJSZWR1Y2VyKHIsIG1hcCkpXG4gICAgcmV0dXJuIG1hcFxuICB9XG5cbiAgaWYgKHR5cGVvZiByZXNvbHZlcnMgPT09ICdzdHJpbmcnKSB7XG4gICAgbWFwLnNldChyZXNvbHZlcnMsIG51bGwpXG4gICAgcmV0dXJuIG1hcFxuICB9XG5cbiAgaWYgKHR5cGVvZiByZXNvbHZlcnMgPT09ICdvYmplY3QnKSB7XG4gICAgZm9yIChsZXQga2V5IGluIHJlc29sdmVycykge1xuICAgICAgbWFwLnNldChrZXksIHJlc29sdmVyc1trZXldKVxuICAgIH1cbiAgICByZXR1cm4gbWFwXG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgcmVzb2x2ZXIgY29uZmlnJylcbn1cblxuZnVuY3Rpb24gcmVxdWlyZVJlc29sdmVyKG5hbWUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVxdWlyZShgZXNsaW50LWltcG9ydC1yZXNvbHZlci0ke25hbWV9YClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmFibGUgdG8gbG9hZCByZXNvbHZlciBcIiR7bmFtZX1cIi5gKVxuICB9XG59XG5cbmNvbnN0IGVycm9yZWRDb250ZXh0cyA9IG5ldyBTZXQoKVxuXG4vKipcbiAqIEdpdmVuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHAgLSBtb2R1bGUgcGF0aFxuICogQHBhcmFtICB7b2JqZWN0fSBjb250ZXh0IC0gRVNMaW50IGNvbnRleHRcbiAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgZnVsbCBtb2R1bGUgZmlsZXN5c3RlbSBwYXRoO1xuICogICAgICAgICAgICAgICAgICAgIG51bGwgaWYgcGFja2FnZSBpcyBjb3JlO1xuICogICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCBpZiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVzb2x2ZShwLCBjb250ZXh0KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlKCBwXG4gICAgICAgICAgICAgICAgICAgLCBjb250ZXh0LmdldEZpbGVuYW1lKClcbiAgICAgICAgICAgICAgICAgICAsIGNvbnRleHQuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICApXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICghZXJyb3JlZENvbnRleHRzLmhhcyhjb250ZXh0KSkge1xuICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICBtZXNzYWdlOiBgUmVzb2x2ZSBlcnJvcjogJHtlcnIubWVzc2FnZX1gLFxuICAgICAgICBsb2M6IHsgbGluZTogMSwgY29sOiAwIH0sXG4gICAgICB9KVxuICAgICAgZXJyb3JlZENvbnRleHRzLmFkZChjb250ZXh0KVxuICAgIH1cbiAgfVxufVxucmVzb2x2ZS5yZWxhdGl2ZSA9IHJlbGF0aXZlXG5cblxuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0bydcbmZ1bmN0aW9uIGhhc2hPYmplY3Qob2JqZWN0KSB7XG4gIGNvbnN0IHNldHRpbmdzU2hhc3VtID0gY3JlYXRlSGFzaCgnc2hhMScpXG4gIHNldHRpbmdzU2hhc3VtLnVwZGF0ZShKU09OLnN0cmluZ2lmeShvYmplY3QpKVxuICByZXR1cm4gc2V0dGluZ3NTaGFzdW0uZGlnZXN0KCdoZXgnKVxufVxuIl19