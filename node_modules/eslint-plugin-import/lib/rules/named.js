'use strict';

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

module.exports = function (context) {
  function checkSpecifiers(key, type, node) {
    if (node.source == null) return; // local export, ignore

    if (!node.specifiers.some(function (im) {
      return im.type === type;
    })) {
      return; // no named imports/exports
    }

    var imports = _getExports2.default.get(node.source.value, context);
    if (imports == null) return;

    if (imports.errors.length) {
      imports.reportErrors(context, node);
      return;
    }

    node.specifiers.forEach(function (im) {
      if (im.type !== type) return;

      var deepLookup = imports.hasDeep(im[key].name);

      if (!deepLookup.found) {
        if (deepLookup.path.length > 1) {
          var deepPath = deepLookup.path.map(function (i) {
            return path.relative(path.dirname(context.getFilename()), i.path);
          }).join(' -> ');

          context.report(im[key], im[key].name + ' not found via ' + deepPath);
        } else {
          context.report(im[key], im[key].name + ' not found in \'' + node.source.value + '\'');
        }
      }
    });
  }

  return {
    'ImportDeclaration': checkSpecifiers.bind(null, 'imported', 'ImportSpecifier'),

    'ExportNamedDeclaration': checkSpecifiers.bind(null, 'local', 'ExportSpecifier')
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25hbWVkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7O0lBQVk7O0FBQ1o7Ozs7Ozs7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsT0FBVixFQUFtQjtBQUNsQyxXQUFTLGVBQVQsQ0FBeUIsR0FBekIsRUFBOEIsSUFBOUIsRUFBb0MsSUFBcEMsRUFBMEM7QUFDeEMsUUFBSSxLQUFLLE1BQUwsSUFBZSxJQUFmLEVBQXFCLE9BQXpCOztBQUR3QyxRQUdwQyxDQUFDLEtBQUssVUFBTCxDQUNFLElBREYsQ0FDTyxVQUFVLEVBQVYsRUFBYztBQUFFLGFBQU8sR0FBRyxJQUFILEtBQVksSUFBWixDQUFUO0tBQWQsQ0FEUixFQUNvRDtBQUN0RDtBQURzRCxLQUR4RDs7QUFLQSxRQUFNLFVBQVUscUJBQVEsR0FBUixDQUFZLEtBQUssTUFBTCxDQUFZLEtBQVosRUFBbUIsT0FBL0IsQ0FBVixDQVJrQztBQVN4QyxRQUFJLFdBQVcsSUFBWCxFQUFpQixPQUFyQjs7QUFFQSxRQUFJLFFBQVEsTUFBUixDQUFlLE1BQWYsRUFBdUI7QUFDekIsY0FBUSxZQUFSLENBQXFCLE9BQXJCLEVBQThCLElBQTlCLEVBRHlCO0FBRXpCLGFBRnlCO0tBQTNCOztBQUtBLFNBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixVQUFVLEVBQVYsRUFBYztBQUNwQyxVQUFJLEdBQUcsSUFBSCxLQUFZLElBQVosRUFBa0IsT0FBdEI7O0FBRUEsVUFBTSxhQUFhLFFBQVEsT0FBUixDQUFnQixHQUFHLEdBQUgsRUFBUSxJQUFSLENBQTdCLENBSDhCOztBQUtwQyxVQUFJLENBQUMsV0FBVyxLQUFYLEVBQWtCO0FBQ3JCLFlBQUksV0FBVyxJQUFYLENBQWdCLE1BQWhCLEdBQXlCLENBQXpCLEVBQTRCO0FBQzlCLGNBQU0sV0FBVyxXQUFXLElBQVgsQ0FDZCxHQURjLENBQ1Y7bUJBQUssS0FBSyxRQUFMLENBQWMsS0FBSyxPQUFMLENBQWEsUUFBUSxXQUFSLEVBQWIsQ0FBZCxFQUFtRCxFQUFFLElBQUY7V0FBeEQsQ0FEVSxDQUVkLElBRmMsQ0FFVCxNQUZTLENBQVgsQ0FEd0I7O0FBSzlCLGtCQUFRLE1BQVIsQ0FBZSxHQUFHLEdBQUgsQ0FBZixFQUNLLEdBQUcsR0FBSCxFQUFRLElBQVIsdUJBQThCLFFBRG5DLEVBTDhCO1NBQWhDLE1BT087QUFDTCxrQkFBUSxNQUFSLENBQWUsR0FBRyxHQUFILENBQWYsRUFDRSxHQUFHLEdBQUgsRUFBUSxJQUFSLEdBQWUsa0JBQWYsR0FBb0MsS0FBSyxNQUFMLENBQVksS0FBWixHQUFvQixJQUF4RCxDQURGLENBREs7U0FQUDtPQURGO0tBTHNCLENBQXhCLENBaEJ3QztHQUExQzs7QUFxQ0EsU0FBTztBQUNMLHlCQUFxQixnQkFBZ0IsSUFBaEIsQ0FBc0IsSUFBdEIsRUFDc0IsVUFEdEIsRUFFc0IsaUJBRnRCLENBQXJCOztBQUtBLDhCQUEwQixnQkFBZ0IsSUFBaEIsQ0FBc0IsSUFBdEIsRUFDc0IsT0FEdEIsRUFFc0IsaUJBRnRCLENBQTFCO0dBTkYsQ0F0Q2tDO0NBQW5CIiwiZmlsZSI6InJ1bGVzL25hbWVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vY29yZS9nZXRFeHBvcnRzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGZ1bmN0aW9uIGNoZWNrU3BlY2lmaWVycyhrZXksIHR5cGUsIG5vZGUpIHtcbiAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCkgcmV0dXJuIC8vIGxvY2FsIGV4cG9ydCwgaWdub3JlXG5cbiAgICBpZiAoIW5vZGUuc3BlY2lmaWVyc1xuICAgICAgICAgIC5zb21lKGZ1bmN0aW9uIChpbSkgeyByZXR1cm4gaW0udHlwZSA9PT0gdHlwZSB9KSkge1xuICAgICAgcmV0dXJuIC8vIG5vIG5hbWVkIGltcG9ydHMvZXhwb3J0c1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICBpZiAoaW1wb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgIGlmIChpbXBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgIGlmIChpbS50eXBlICE9PSB0eXBlKSByZXR1cm5cblxuICAgICAgY29uc3QgZGVlcExvb2t1cCA9IGltcG9ydHMuaGFzRGVlcChpbVtrZXldLm5hbWUpXG5cbiAgICAgIGlmICghZGVlcExvb2t1cC5mb3VuZCkge1xuICAgICAgICBpZiAoZGVlcExvb2t1cC5wYXRoLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBjb25zdCBkZWVwUGF0aCA9IGRlZXBMb29rdXAucGF0aFxuICAgICAgICAgICAgLm1hcChpID0+IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKGNvbnRleHQuZ2V0RmlsZW5hbWUoKSksIGkucGF0aCkpXG4gICAgICAgICAgICAuam9pbignIC0+ICcpXG5cbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgYCR7aW1ba2V5XS5uYW1lfSBub3QgZm91bmQgdmlhICR7ZGVlcFBhdGh9YClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgaW1ba2V5XS5uYW1lICsgJyBub3QgZm91bmQgaW4gXFwnJyArIG5vZGUuc291cmNlLnZhbHVlICsgJ1xcJycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICAnSW1wb3J0RGVjbGFyYXRpb24nOiBjaGVja1NwZWNpZmllcnMuYmluZCggbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCAnaW1wb3J0ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsICdJbXBvcnRTcGVjaWZpZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuXG4gICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBjaGVja1NwZWNpZmllcnMuYmluZCggbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsICdsb2NhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCAnRXhwb3J0U3BlY2lmaWVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuICB9XG5cbn1cbiJdfQ==