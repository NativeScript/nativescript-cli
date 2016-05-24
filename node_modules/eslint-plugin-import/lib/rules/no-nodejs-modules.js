'use strict';

var _importType = require('../core/importType');

var _importType2 = _interopRequireDefault(_importType);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function reportIfMissing(context, node, name) {
  if ((0, _importType2.default)(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin modules');
  }
}

module.exports = function (context) {
  return {
    ImportDeclaration: function handleImports(node) {
      reportIfMissing(context, node, node.source.value);
    },
    CallExpression: function handleRequires(node) {
      if ((0, _staticRequire2.default)(node)) {
        reportIfMissing(context, node, node.arguments[0].value);
      }
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW5vZGVqcy1tb2R1bGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7Ozs7O0FBRUEsU0FBUyxlQUFULENBQXlCLE9BQXpCLEVBQWtDLElBQWxDLEVBQXdDLElBQXhDLEVBQThDO0FBQzVDLE1BQUksMEJBQVcsSUFBWCxFQUFpQixPQUFqQixNQUE4QixTQUE5QixFQUF5QztBQUMzQyxZQUFRLE1BQVIsQ0FBZSxJQUFmLEVBQXFCLHVDQUFyQixFQUQyQztHQUE3QztDQURGOztBQU1BLE9BQU8sT0FBUCxHQUFpQixVQUFVLE9BQVYsRUFBbUI7QUFDbEMsU0FBTztBQUNMLHVCQUFtQixTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDOUMsc0JBQWdCLE9BQWhCLEVBQXlCLElBQXpCLEVBQStCLEtBQUssTUFBTCxDQUFZLEtBQVosQ0FBL0IsQ0FEOEM7S0FBN0I7QUFHbkIsb0JBQWdCLFNBQVMsY0FBVCxDQUF3QixJQUF4QixFQUE4QjtBQUM1QyxVQUFJLDZCQUFnQixJQUFoQixDQUFKLEVBQTJCO0FBQ3pCLHdCQUFnQixPQUFoQixFQUF5QixJQUF6QixFQUErQixLQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLEtBQWxCLENBQS9CLENBRHlCO09BQTNCO0tBRGM7R0FKbEIsQ0FEa0M7Q0FBbkIiLCJmaWxlIjoicnVsZXMvbm8tbm9kZWpzLW1vZHVsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW1wb3J0VHlwZSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnXG5pbXBvcnQgaXNTdGF0aWNSZXF1aXJlIGZyb20gJy4uL2NvcmUvc3RhdGljUmVxdWlyZSdcblxuZnVuY3Rpb24gcmVwb3J0SWZNaXNzaW5nKGNvbnRleHQsIG5vZGUsIG5hbWUpIHtcbiAgaWYgKGltcG9ydFR5cGUobmFtZSwgY29udGV4dCkgPT09ICdidWlsdGluJykge1xuICAgIGNvbnRleHQucmVwb3J0KG5vZGUsICdEbyBub3QgaW1wb3J0IE5vZGUuanMgYnVpbHRpbiBtb2R1bGVzJylcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIHJldHVybiB7XG4gICAgSW1wb3J0RGVjbGFyYXRpb246IGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZSkge1xuICAgICAgcmVwb3J0SWZNaXNzaW5nKGNvbnRleHQsIG5vZGUsIG5vZGUuc291cmNlLnZhbHVlKVxuICAgIH0sXG4gICAgQ2FsbEV4cHJlc3Npb246IGZ1bmN0aW9uIGhhbmRsZVJlcXVpcmVzKG5vZGUpIHtcbiAgICAgIGlmIChpc1N0YXRpY1JlcXVpcmUobm9kZSkpIHtcbiAgICAgICAgcmVwb3J0SWZNaXNzaW5nKGNvbnRleHQsIG5vZGUsIG5vZGUuYXJndW1lbnRzWzBdLnZhbHVlKVxuICAgICAgfVxuICAgIH0sXG4gIH1cbn1cbiJdfQ==