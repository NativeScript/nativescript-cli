'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash.endswith');

var _lodash2 = _interopRequireDefault(_lodash);

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _importType = require('../core/importType');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {
  var configuration = context.options[0] || 'never';

  function isUseOfExtensionEnforced(extension) {
    if ((typeof configuration === 'undefined' ? 'undefined' : _typeof(configuration)) === 'object') {
      return configuration[extension] === 'always';
    }

    return configuration === 'always';
  }

  function isResolvableWithoutExtension(file) {
    var extension = _path2.default.extname(file);
    var fileWithoutExtension = file.slice(0, -extension.length);
    var resolvedFileWithoutExtension = (0, _resolve2.default)(fileWithoutExtension, context);

    return resolvedFileWithoutExtension === (0, _resolve2.default)(file, context);
  }

  function checkFileExtension(node) {
    var source = node.source;

    var importPath = source.value;

    // don't enforce anything on builtins
    if ((0, _importType.isBuiltIn)(importPath)) return;

    var resolvedPath = (0, _resolve2.default)(importPath, context);

    // get extension from resolved path, if possible.
    // for unresolved, use source value.
    var extension = _path2.default.extname(resolvedPath || importPath).substring(1);

    if (!extension || !(0, _lodash2.default)(importPath, extension)) {
      if (isUseOfExtensionEnforced(extension)) {
        context.report({
          node: source,
          message: 'Missing file extension ' + (extension ? '"' + extension + '" ' : '') + 'for "' + importPath + '"'
        });
      }
    } else if (extension) {
      if (!isUseOfExtensionEnforced(extension) && isResolvableWithoutExtension(importPath)) {
        context.report({
          node: source,
          message: 'Unexpected use of file extension "' + extension + '" for "' + importPath + '"'
        });
      }
    }
  }

  return {
    ImportDeclaration: checkFileExtension
  };
};

module.exports.schema = [{
  oneOf: [{
    enum: ['always', 'never']
  }, {
    type: 'object',
    patternProperties: {
      '.*': { enum: ['always', 'never'] }
    }
  }]
}];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2V4dGVuc2lvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsT0FBVixFQUFtQjtBQUNsQyxNQUFNLGdCQUFnQixRQUFRLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsT0FBdEIsQ0FEWTs7QUFHbEMsV0FBUyx3QkFBVCxDQUFrQyxTQUFsQyxFQUE2QztBQUMzQyxRQUFJLFFBQU8scUVBQVAsS0FBeUIsUUFBekIsRUFBbUM7QUFDckMsYUFBTyxjQUFjLFNBQWQsTUFBNkIsUUFBN0IsQ0FEOEI7S0FBdkM7O0FBSUEsV0FBTyxrQkFBa0IsUUFBbEIsQ0FMb0M7R0FBN0M7O0FBUUEsV0FBUyw0QkFBVCxDQUFzQyxJQUF0QyxFQUE0QztBQUMxQyxRQUFNLFlBQVksZUFBSyxPQUFMLENBQWEsSUFBYixDQUFaLENBRG9DO0FBRTFDLFFBQU0sdUJBQXVCLEtBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLFVBQVUsTUFBVixDQUF0QyxDQUZvQztBQUcxQyxRQUFNLCtCQUErQix1QkFBUSxvQkFBUixFQUE4QixPQUE5QixDQUEvQixDQUhvQzs7QUFLMUMsV0FBTyxpQ0FBaUMsdUJBQVEsSUFBUixFQUFjLE9BQWQsQ0FBakMsQ0FMbUM7R0FBNUM7O0FBUUEsV0FBUyxrQkFBVCxDQUE0QixJQUE1QixFQUFrQztRQUN4QixTQUFXLEtBQVgsT0FEd0I7O0FBRWhDLFFBQU0sYUFBYSxPQUFPLEtBQVA7OztBQUZhLFFBSzVCLDJCQUFVLFVBQVYsQ0FBSixFQUEyQixPQUEzQjs7QUFFQSxRQUFNLGVBQWUsdUJBQVEsVUFBUixFQUFvQixPQUFwQixDQUFmOzs7O0FBUDBCLFFBVzFCLFlBQVksZUFBSyxPQUFMLENBQWEsZ0JBQWdCLFVBQWhCLENBQWIsQ0FBeUMsU0FBekMsQ0FBbUQsQ0FBbkQsQ0FBWixDQVgwQjs7QUFhaEMsUUFBSSxDQUFDLFNBQUQsSUFBYyxDQUFDLHNCQUFTLFVBQVQsRUFBcUIsU0FBckIsQ0FBRCxFQUFrQztBQUNsRCxVQUFJLHlCQUF5QixTQUF6QixDQUFKLEVBQXlDO0FBQ3ZDLGdCQUFRLE1BQVIsQ0FBZTtBQUNiLGdCQUFNLE1BQU47QUFDQSxnREFDNEIsa0JBQWdCLGdCQUFoQixHQUFnQyxFQUFoQyxjQUEwQyxnQkFEdEU7U0FGRixFQUR1QztPQUF6QztLQURGLE1BUU8sSUFBSSxTQUFKLEVBQWU7QUFDcEIsVUFBSSxDQUFDLHlCQUF5QixTQUF6QixDQUFELElBQXdDLDZCQUE2QixVQUE3QixDQUF4QyxFQUFrRjtBQUNwRixnQkFBUSxNQUFSLENBQWU7QUFDYixnQkFBTSxNQUFOO0FBQ0EsMERBQThDLHdCQUFtQixnQkFBakU7U0FGRixFQURvRjtPQUF0RjtLQURLO0dBckJUOztBQStCQSxTQUFPO0FBQ0wsdUJBQW1CLGtCQUFuQjtHQURGLENBbERrQztDQUFuQjs7QUF1RGpCLE9BQU8sT0FBUCxDQUFlLE1BQWYsR0FBd0IsQ0FDdEI7QUFDRSxTQUFPLENBQ0w7QUFDRSxVQUFNLENBQUUsUUFBRixFQUFZLE9BQVosQ0FBTjtHQUZHLEVBSUw7QUFDRSxVQUFNLFFBQU47QUFDQSx1QkFBbUI7QUFDakIsWUFBTSxFQUFFLE1BQU0sQ0FBRSxRQUFGLEVBQVksT0FBWixDQUFOLEVBQVI7S0FERjtHQU5HLENBQVA7Q0FGb0IsQ0FBeEIiLCJmaWxlIjoicnVsZXMvZXh0ZW5zaW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZW5kc1dpdGggZnJvbSAnbG9kYXNoLmVuZHN3aXRoJ1xuXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICcuLi9jb3JlL3Jlc29sdmUnXG5pbXBvcnQgeyBpc0J1aWx0SW4gfSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgY29uc3QgY29uZmlndXJhdGlvbiA9IGNvbnRleHQub3B0aW9uc1swXSB8fCAnbmV2ZXInXG5cbiAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvbkVuZm9yY2VkKGV4dGVuc2lvbikge1xuICAgIGlmICh0eXBlb2YgY29uZmlndXJhdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBjb25maWd1cmF0aW9uW2V4dGVuc2lvbl0gPT09ICdhbHdheXMnXG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbmZpZ3VyYXRpb24gPT09ICdhbHdheXMnXG4gIH1cblxuICBmdW5jdGlvbiBpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uKGZpbGUpIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZSlcbiAgICBjb25zdCBmaWxlV2l0aG91dEV4dGVuc2lvbiA9IGZpbGUuc2xpY2UoMCwgLWV4dGVuc2lvbi5sZW5ndGgpXG4gICAgY29uc3QgcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9IHJlc29sdmUoZmlsZVdpdGhvdXRFeHRlbnNpb24sIGNvbnRleHQpXG5cbiAgICByZXR1cm4gcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9PT0gcmVzb2x2ZShmaWxlLCBjb250ZXh0KVxuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tGaWxlRXh0ZW5zaW9uKG5vZGUpIHtcbiAgICBjb25zdCB7IHNvdXJjZSB9ID0gbm9kZVxuICAgIGNvbnN0IGltcG9ydFBhdGggPSBzb3VyY2UudmFsdWVcblxuICAgIC8vIGRvbid0IGVuZm9yY2UgYW55dGhpbmcgb24gYnVpbHRpbnNcbiAgICBpZiAoaXNCdWlsdEluKGltcG9ydFBhdGgpKSByZXR1cm5cblxuICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmUoaW1wb3J0UGF0aCwgY29udGV4dClcblxuICAgIC8vIGdldCBleHRlbnNpb24gZnJvbSByZXNvbHZlZCBwYXRoLCBpZiBwb3NzaWJsZS5cbiAgICAvLyBmb3IgdW5yZXNvbHZlZCwgdXNlIHNvdXJjZSB2YWx1ZS5cbiAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUocmVzb2x2ZWRQYXRoIHx8IGltcG9ydFBhdGgpLnN1YnN0cmluZygxKVxuXG4gICAgaWYgKCFleHRlbnNpb24gfHwgIWVuZHNXaXRoKGltcG9ydFBhdGgsIGV4dGVuc2lvbikpIHtcbiAgICAgIGlmIChpc1VzZU9mRXh0ZW5zaW9uRW5mb3JjZWQoZXh0ZW5zaW9uKSkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgbm9kZTogc291cmNlLFxuICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICBgTWlzc2luZyBmaWxlIGV4dGVuc2lvbiAke2V4dGVuc2lvbiA/IGBcIiR7ZXh0ZW5zaW9ufVwiIGAgOiAnJ31mb3IgXCIke2ltcG9ydFBhdGh9XCJgLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZXh0ZW5zaW9uKSB7XG4gICAgICBpZiAoIWlzVXNlT2ZFeHRlbnNpb25FbmZvcmNlZChleHRlbnNpb24pICYmIGlzUmVzb2x2YWJsZVdpdGhvdXRFeHRlbnNpb24oaW1wb3J0UGF0aCkpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICBtZXNzYWdlOiBgVW5leHBlY3RlZCB1c2Ugb2YgZmlsZSBleHRlbnNpb24gXCIke2V4dGVuc2lvbn1cIiBmb3IgXCIke2ltcG9ydFBhdGh9XCJgLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgSW1wb3J0RGVjbGFyYXRpb246IGNoZWNrRmlsZUV4dGVuc2lvbixcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5zY2hlbWEgPSBbXG4gIHtcbiAgICBvbmVPZjogW1xuICAgICAge1xuICAgICAgICBlbnVtOiBbICdhbHdheXMnLCAnbmV2ZXInIF0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcGF0dGVyblByb3BlcnRpZXM6IHtcbiAgICAgICAgICAnLionOiB7IGVudW06IFsgJ2Fsd2F5cycsICduZXZlcicgXSB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXVxuIl19