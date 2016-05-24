'use strict';

/**
 * @fileoverview Rule to prefer ES6 to CJS
 * @author Jamund Ferguson
 */

var EXPORT_MESSAGE = 'Expected "export" or "export default"',
    IMPORT_MESSAGE = 'Expected "import" instead of "require()"';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  return {

    'MemberExpression': function MemberExpression(node) {

      // module.exports
      if (node.object.name === 'module' && node.property.name === 'exports') {
        if (allowPrimitive(node, context)) return;
        context.report({ node: node, message: EXPORT_MESSAGE });
      }

      // exports.
      if (node.object.name === 'exports') {
        context.report({ node: node, message: EXPORT_MESSAGE });
      }
    },
    'CallExpression': function CallExpression(call) {
      if (context.getScope().type !== 'module') return;

      if (call.callee.type !== 'Identifier') return;
      if (call.callee.name !== 'require') return;

      if (call.arguments.length !== 1) return;
      var module = call.arguments[0];

      if (module.type !== 'Literal') return;
      if (typeof module.value !== 'string') return;

      // keeping it simple: all 1-string-arg `require` calls are reported
      context.report({
        node: call.callee,
        message: IMPORT_MESSAGE
      });
    }
  };
};

// allow non-objects as module.exports
function allowPrimitive(node, context) {
  if (context.options.indexOf('allow-primitive-modules') < 0) return false;
  if (node.parent.type !== 'AssignmentExpression') return false;
  return node.parent.right.type !== 'ObjectExpression';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWNvbW1vbmpzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFLQSxJQUFNLGlCQUFpQix1Q0FBakI7SUFDQSxpQkFBaUIsMENBQWpCOzs7Ozs7QUFPTixPQUFPLE9BQVAsR0FBaUIsVUFBVSxPQUFWLEVBQW1COztBQUVsQyxTQUFPOztBQUVMLHdCQUFvQiwwQkFBVSxJQUFWLEVBQWdCOzs7QUFHbEMsVUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFFBQXJCLElBQWlDLEtBQUssUUFBTCxDQUFjLElBQWQsS0FBdUIsU0FBdkIsRUFBa0M7QUFDckUsWUFBSSxlQUFlLElBQWYsRUFBcUIsT0FBckIsQ0FBSixFQUFtQyxPQUFuQztBQUNBLGdCQUFRLE1BQVIsQ0FBZSxFQUFFLFVBQUYsRUFBUSxTQUFTLGNBQVQsRUFBdkIsRUFGcUU7T0FBdkU7OztBQUhrQyxVQVM5QixLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFNBQXJCLEVBQWdDO0FBQ2xDLGdCQUFRLE1BQVIsQ0FBZSxFQUFFLFVBQUYsRUFBUSxTQUFTLGNBQVQsRUFBdkIsRUFEa0M7T0FBcEM7S0FUa0I7QUFjcEIsc0JBQWtCLHdCQUFVLElBQVYsRUFBZ0I7QUFDaEMsVUFBSSxRQUFRLFFBQVIsR0FBbUIsSUFBbkIsS0FBNEIsUUFBNUIsRUFBc0MsT0FBMUM7O0FBRUEsVUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFlBQXJCLEVBQW1DLE9BQXZDO0FBQ0EsVUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFNBQXJCLEVBQWdDLE9BQXBDOztBQUVBLFVBQUksS0FBSyxTQUFMLENBQWUsTUFBZixLQUEwQixDQUExQixFQUE2QixPQUFqQztBQUNBLFVBQUksU0FBUyxLQUFLLFNBQUwsQ0FBZSxDQUFmLENBQVQsQ0FQNEI7O0FBU2hDLFVBQUksT0FBTyxJQUFQLEtBQWdCLFNBQWhCLEVBQTJCLE9BQS9CO0FBQ0EsVUFBSSxPQUFPLE9BQU8sS0FBUCxLQUFpQixRQUF4QixFQUFrQyxPQUF0Qzs7O0FBVmdDLGFBYWhDLENBQVEsTUFBUixDQUFlO0FBQ2IsY0FBTSxLQUFLLE1BQUw7QUFDTixpQkFBUyxjQUFUO09BRkYsRUFiZ0M7S0FBaEI7R0FoQnBCLENBRmtDO0NBQW5COzs7QUF5Q2pCLFNBQVMsY0FBVCxDQUF3QixJQUF4QixFQUE4QixPQUE5QixFQUF1QztBQUNyQyxNQUFJLFFBQVEsT0FBUixDQUFnQixPQUFoQixDQUF3Qix5QkFBeEIsSUFBcUQsQ0FBckQsRUFBd0QsT0FBTyxLQUFQLENBQTVEO0FBQ0EsTUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLHNCQUFyQixFQUE2QyxPQUFPLEtBQVAsQ0FBakQ7QUFDQSxTQUFRLEtBQUssTUFBTCxDQUFZLEtBQVosQ0FBa0IsSUFBbEIsS0FBMkIsa0JBQTNCLENBSDZCO0NBQXZDIiwiZmlsZSI6InJ1bGVzL25vLWNvbW1vbmpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gcHJlZmVyIEVTNiB0byBDSlNcbiAqIEBhdXRob3IgSmFtdW5kIEZlcmd1c29uXG4gKi9cblxuY29uc3QgRVhQT1JUX01FU1NBR0UgPSAnRXhwZWN0ZWQgXCJleHBvcnRcIiBvciBcImV4cG9ydCBkZWZhdWx0XCInXG4gICAgLCBJTVBPUlRfTUVTU0FHRSA9ICdFeHBlY3RlZCBcImltcG9ydFwiIGluc3RlYWQgb2YgXCJyZXF1aXJlKClcIidcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG5cbiAgcmV0dXJuIHtcblxuICAgICdNZW1iZXJFeHByZXNzaW9uJzogZnVuY3Rpb24gKG5vZGUpIHtcblxuICAgICAgLy8gbW9kdWxlLmV4cG9ydHNcbiAgICAgIGlmIChub2RlLm9iamVjdC5uYW1lID09PSAnbW9kdWxlJyAmJiBub2RlLnByb3BlcnR5Lm5hbWUgPT09ICdleHBvcnRzJykge1xuICAgICAgICBpZiAoYWxsb3dQcmltaXRpdmUobm9kZSwgY29udGV4dCkpIHJldHVyblxuICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGUsIG1lc3NhZ2U6IEVYUE9SVF9NRVNTQUdFIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIGV4cG9ydHMuXG4gICAgICBpZiAobm9kZS5vYmplY3QubmFtZSA9PT0gJ2V4cG9ydHMnKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZSwgbWVzc2FnZTogRVhQT1JUX01FU1NBR0UgfSlcbiAgICAgIH1cblxuICAgIH0sXG4gICAgJ0NhbGxFeHByZXNzaW9uJzogZnVuY3Rpb24gKGNhbGwpIHtcbiAgICAgIGlmIChjb250ZXh0LmdldFNjb3BlKCkudHlwZSAhPT0gJ21vZHVsZScpIHJldHVyblxuXG4gICAgICBpZiAoY2FsbC5jYWxsZWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICAgIGlmIChjYWxsLmNhbGxlZS5uYW1lICE9PSAncmVxdWlyZScpIHJldHVyblxuXG4gICAgICBpZiAoY2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSByZXR1cm5cbiAgICAgIHZhciBtb2R1bGUgPSBjYWxsLmFyZ3VtZW50c1swXVxuXG4gICAgICBpZiAobW9kdWxlLnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuXG4gICAgICBpZiAodHlwZW9mIG1vZHVsZS52YWx1ZSAhPT0gJ3N0cmluZycpIHJldHVyblxuXG4gICAgICAvLyBrZWVwaW5nIGl0IHNpbXBsZTogYWxsIDEtc3RyaW5nLWFyZyBgcmVxdWlyZWAgY2FsbHMgYXJlIHJlcG9ydGVkXG4gICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgIG5vZGU6IGNhbGwuY2FsbGVlLFxuICAgICAgICBtZXNzYWdlOiBJTVBPUlRfTUVTU0FHRSxcbiAgICAgIH0pXG4gICAgfSxcbiAgfVxuXG59XG5cbiAgLy8gYWxsb3cgbm9uLW9iamVjdHMgYXMgbW9kdWxlLmV4cG9ydHNcbmZ1bmN0aW9uIGFsbG93UHJpbWl0aXZlKG5vZGUsIGNvbnRleHQpIHtcbiAgaWYgKGNvbnRleHQub3B0aW9ucy5pbmRleE9mKCdhbGxvdy1wcmltaXRpdmUtbW9kdWxlcycpIDwgMCkgcmV0dXJuIGZhbHNlXG4gIGlmIChub2RlLnBhcmVudC50eXBlICE9PSAnQXNzaWdubWVudEV4cHJlc3Npb24nKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIChub2RlLnBhcmVudC5yaWdodC50eXBlICE9PSAnT2JqZWN0RXhwcmVzc2lvbicpXG59XG4iXX0=