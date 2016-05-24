'use strict';

/**
 * @fileoverview Rule to prefer imports to AMD
 * @author Jamund Ferguson
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

  return {

    'CallExpression': function CallExpression(node) {
      if (context.getScope().type !== 'module') return;

      if (node.callee.type !== 'Identifier') return;
      if (node.callee.name !== 'require' && node.callee.name !== 'define') return;

      // todo: capture define((require, module, exports) => {}) form?
      if (node.arguments.length !== 2) return;

      var modules = node.arguments[0];
      if (modules.type !== 'ArrayExpression') return;

      // todo: check second arg type? (identifier or callback)

      context.report(node, 'Expected imports instead of AMD ' + node.callee.name + '().');
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWFtZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sT0FBUCxHQUFpQixVQUFVLE9BQVYsRUFBbUI7O0FBRW5DLFNBQU87O0FBRU4sc0JBQWtCLHdCQUFVLElBQVYsRUFBZ0I7QUFDOUIsVUFBSSxRQUFRLFFBQVIsR0FBbUIsSUFBbkIsS0FBNEIsUUFBNUIsRUFBc0MsT0FBMUM7O0FBRUEsVUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFlBQXJCLEVBQW1DLE9BQXZDO0FBQ0EsVUFBSSxLQUFLLE1BQUwsQ0FBWSxJQUFaLEtBQXFCLFNBQXJCLElBQ0EsS0FBSyxNQUFMLENBQVksSUFBWixLQUFxQixRQUFyQixFQUErQixPQURuQzs7O0FBSjhCLFVBUTFCLEtBQUssU0FBTCxDQUFlLE1BQWYsS0FBMEIsQ0FBMUIsRUFBNkIsT0FBakM7O0FBRUEsVUFBTSxVQUFVLEtBQUssU0FBTCxDQUFlLENBQWYsQ0FBVixDQVZ3QjtBQVc5QixVQUFJLFFBQVEsSUFBUixLQUFpQixpQkFBakIsRUFBb0MsT0FBeEM7Ozs7QUFYOEIsYUFlakMsQ0FBUSxNQUFSLENBQWUsSUFBZix1Q0FBd0QsS0FBSyxNQUFMLENBQVksSUFBWixRQUF4RCxFQWZpQztLQUFoQjtHQUZuQixDQUZtQztDQUFuQiIsImZpbGUiOiJydWxlcy9uby1hbWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUnVsZSB0byBwcmVmZXIgaW1wb3J0cyB0byBBTURcbiAqIEBhdXRob3IgSmFtdW5kIEZlcmd1c29uXG4gKi9cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuXG5cdHJldHVybiB7XG5cblx0XHQnQ2FsbEV4cHJlc3Npb24nOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgaWYgKGNvbnRleHQuZ2V0U2NvcGUoKS50eXBlICE9PSAnbW9kdWxlJykgcmV0dXJuXG5cbiAgICAgIGlmIChub2RlLmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVyblxuICAgICAgaWYgKG5vZGUuY2FsbGVlLm5hbWUgIT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgIG5vZGUuY2FsbGVlLm5hbWUgIT09ICdkZWZpbmUnKSByZXR1cm5cblxuICAgICAgLy8gdG9kbzogY2FwdHVyZSBkZWZpbmUoKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cykgPT4ge30pIGZvcm0/XG4gICAgICBpZiAobm9kZS5hcmd1bWVudHMubGVuZ3RoICE9PSAyKSByZXR1cm5cblxuICAgICAgY29uc3QgbW9kdWxlcyA9IG5vZGUuYXJndW1lbnRzWzBdXG4gICAgICBpZiAobW9kdWxlcy50eXBlICE9PSAnQXJyYXlFeHByZXNzaW9uJykgcmV0dXJuXG5cbiAgICAgIC8vIHRvZG86IGNoZWNrIHNlY29uZCBhcmcgdHlwZT8gKGlkZW50aWZpZXIgb3IgY2FsbGJhY2spXG5cblx0XHRcdGNvbnRleHQucmVwb3J0KG5vZGUsIGBFeHBlY3RlZCBpbXBvcnRzIGluc3RlYWQgb2YgQU1EICR7bm9kZS5jYWxsZWUubmFtZX0oKS5gKVxuXHRcdH0sXG5cdH1cblxufVxuIl19