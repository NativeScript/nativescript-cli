'use strict';

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {

  function checkDefault(specifierType, node) {

    // poor man's Array.find
    var defaultSpecifier = void 0;
    node.specifiers.some(function (n) {
      if (n.type === specifierType) {
        defaultSpecifier = n;
        return true;
      }
    });

    if (!defaultSpecifier) return;
    var imports = _getExports2.default.get(node.source.value, context);
    if (imports == null) return;

    if (imports.errors.length) {
      imports.reportErrors(context, node);
    } else if (!imports.get('default')) {
      context.report(defaultSpecifier, 'No default export found in module.');
    }
  }

  return {
    'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
    'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier')
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2RlZmF1bHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFVBQVUsT0FBVixFQUFtQjs7QUFFbEMsV0FBUyxZQUFULENBQXNCLGFBQXRCLEVBQXFDLElBQXJDLEVBQTJDOzs7QUFHekMsUUFBSSx5QkFBSixDQUh5QztBQUl6QyxTQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsVUFBQyxDQUFELEVBQU87QUFDMUIsVUFBSSxFQUFFLElBQUYsS0FBVyxhQUFYLEVBQTBCO0FBQzVCLDJCQUFtQixDQUFuQixDQUQ0QjtBQUU1QixlQUFPLElBQVAsQ0FGNEI7T0FBOUI7S0FEbUIsQ0FBckIsQ0FKeUM7O0FBV3pDLFFBQUksQ0FBQyxnQkFBRCxFQUFtQixPQUF2QjtBQUNBLFFBQUksVUFBVSxxQkFBUSxHQUFSLENBQVksS0FBSyxNQUFMLENBQVksS0FBWixFQUFtQixPQUEvQixDQUFWLENBWnFDO0FBYXpDLFFBQUksV0FBVyxJQUFYLEVBQWlCLE9BQXJCOztBQUVBLFFBQUksUUFBUSxNQUFSLENBQWUsTUFBZixFQUF1QjtBQUN6QixjQUFRLFlBQVIsQ0FBcUIsT0FBckIsRUFBOEIsSUFBOUIsRUFEeUI7S0FBM0IsTUFFTyxJQUFJLENBQUMsUUFBUSxHQUFSLENBQVksU0FBWixDQUFELEVBQXlCO0FBQ2xDLGNBQVEsTUFBUixDQUFlLGdCQUFmLEVBQWlDLG9DQUFqQyxFQURrQztLQUE3QjtHQWpCVDs7QUFzQkEsU0FBTztBQUNMLHlCQUFxQixhQUFhLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0Isd0JBQXhCLENBQXJCO0FBQ0EsOEJBQTBCLGFBQWEsSUFBYixDQUFrQixJQUFsQixFQUF3Qix3QkFBeEIsQ0FBMUI7R0FGRixDQXhCa0M7Q0FBbkIiLCJmaWxlIjoicnVsZXMvZGVmYXVsdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeHBvcnRzIGZyb20gJy4uL2NvcmUvZ2V0RXhwb3J0cydcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuXG4gIGZ1bmN0aW9uIGNoZWNrRGVmYXVsdChzcGVjaWZpZXJUeXBlLCBub2RlKSB7XG5cbiAgICAvLyBwb29yIG1hbidzIEFycmF5LmZpbmRcbiAgICBsZXQgZGVmYXVsdFNwZWNpZmllclxuICAgIG5vZGUuc3BlY2lmaWVycy5zb21lKChuKSA9PiB7XG4gICAgICBpZiAobi50eXBlID09PSBzcGVjaWZpZXJUeXBlKSB7XG4gICAgICAgIGRlZmF1bHRTcGVjaWZpZXIgPSBuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICghZGVmYXVsdFNwZWNpZmllcikgcmV0dXJuXG4gICAgdmFyIGltcG9ydHMgPSBFeHBvcnRzLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICBpZiAoaW1wb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgIGlmIChpbXBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgfSBlbHNlIGlmICghaW1wb3J0cy5nZXQoJ2RlZmF1bHQnKSkge1xuICAgICAgY29udGV4dC5yZXBvcnQoZGVmYXVsdFNwZWNpZmllciwgJ05vIGRlZmF1bHQgZXhwb3J0IGZvdW5kIGluIG1vZHVsZS4nKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgJ0ltcG9ydERlY2xhcmF0aW9uJzogY2hlY2tEZWZhdWx0LmJpbmQobnVsbCwgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInKSxcbiAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJyksXG4gIH1cbn1cbiJdfQ==