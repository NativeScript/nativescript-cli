'use strict';

module.exports = function (context) {
  function isPossibleDirective(node) {
    return node.type === 'ExpressionStatement' && node.expression.type === 'Literal' && typeof node.expression.value === 'string';
  }

  return {
    'Program': function Program(n) {
      var body = n.body,
          absoluteFirst = context.options[0] === 'absolute-first';
      var nonImportCount = 0,
          anyExpressions = false,
          anyRelative = false;
      body.forEach(function (node) {
        if (!anyExpressions && isPossibleDirective(node)) {
          return;
        }

        anyExpressions = true;

        if (node.type === 'ImportDeclaration') {
          if (absoluteFirst) {
            if (/^\./.test(node.source.value)) {
              anyRelative = true;
            } else if (anyRelative) {
              context.report({
                node: node.source,
                message: 'Absolute imports should come before relative imports.'
              });
            }
          }
          if (nonImportCount > 0) {
            context.report({
              node: node,
              message: 'Import in body of module; reorder to top.'
            });
          }
        } else {
          nonImportCount++;
        }
      });
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2ltcG9ydHMtZmlyc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxPQUFPLE9BQVAsR0FBaUIsVUFBVSxPQUFWLEVBQW1CO0FBQ2xDLFdBQVMsbUJBQVQsQ0FBOEIsSUFBOUIsRUFBb0M7QUFDbEMsV0FBTyxLQUFLLElBQUwsS0FBYyxxQkFBZCxJQUNMLEtBQUssVUFBTCxDQUFnQixJQUFoQixLQUF5QixTQUF6QixJQUNBLE9BQU8sS0FBSyxVQUFMLENBQWdCLEtBQWhCLEtBQTBCLFFBQWpDLENBSGdDO0dBQXBDOztBQU1BLFNBQU87QUFDTCxlQUFXLGlCQUFVLENBQVYsRUFBYTtBQUN0QixVQUFNLE9BQU8sRUFBRSxJQUFGO1VBQ1AsZ0JBQWdCLFFBQVEsT0FBUixDQUFnQixDQUFoQixNQUF1QixnQkFBdkIsQ0FGQTtBQUd0QixVQUFJLGlCQUFpQixDQUFqQjtVQUNBLGlCQUFpQixLQUFqQjtVQUNBLGNBQWMsS0FBZCxDQUxrQjtBQU10QixXQUFLLE9BQUwsQ0FBYSxVQUFVLElBQVYsRUFBZTtBQUMxQixZQUFJLENBQUMsY0FBRCxJQUFtQixvQkFBb0IsSUFBcEIsQ0FBbkIsRUFBOEM7QUFDaEQsaUJBRGdEO1NBQWxEOztBQUlBLHlCQUFpQixJQUFqQixDQUwwQjs7QUFPMUIsWUFBSSxLQUFLLElBQUwsS0FBYyxtQkFBZCxFQUFtQztBQUNyQyxjQUFJLGFBQUosRUFBbUI7QUFDakIsZ0JBQUksTUFBTSxJQUFOLENBQVcsS0FBSyxNQUFMLENBQVksS0FBWixDQUFmLEVBQW1DO0FBQ2pDLDRCQUFjLElBQWQsQ0FEaUM7YUFBbkMsTUFFTyxJQUFJLFdBQUosRUFBaUI7QUFDdEIsc0JBQVEsTUFBUixDQUFlO0FBQ2Isc0JBQU0sS0FBSyxNQUFMO0FBQ04seUJBQVMsdURBQVQ7ZUFGRixFQURzQjthQUFqQjtXQUhUO0FBVUEsY0FBSSxpQkFBaUIsQ0FBakIsRUFBb0I7QUFDdEIsb0JBQVEsTUFBUixDQUFlO0FBQ2Isd0JBRGE7QUFFYix1QkFBUywyQ0FBVDthQUZGLEVBRHNCO1dBQXhCO1NBWEYsTUFpQk87QUFDTCwyQkFESztTQWpCUDtPQVBXLENBQWIsQ0FOc0I7S0FBYjtHQURiLENBUGtDO0NBQW5CIiwiZmlsZSI6InJ1bGVzL2ltcG9ydHMtZmlyc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIGZ1bmN0aW9uIGlzUG9zc2libGVEaXJlY3RpdmUgKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50eXBlID09PSAnRXhwcmVzc2lvblN0YXRlbWVudCcgJiZcbiAgICAgIG5vZGUuZXhwcmVzc2lvbi50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgIHR5cGVvZiBub2RlLmV4cHJlc3Npb24udmFsdWUgPT09ICdzdHJpbmcnXG4gIH1cblxuICByZXR1cm4ge1xuICAgICdQcm9ncmFtJzogZnVuY3Rpb24gKG4pIHtcbiAgICAgIGNvbnN0IGJvZHkgPSBuLmJvZHlcbiAgICAgICAgICAsIGFic29sdXRlRmlyc3QgPSBjb250ZXh0Lm9wdGlvbnNbMF0gPT09ICdhYnNvbHV0ZS1maXJzdCdcbiAgICAgIGxldCBub25JbXBvcnRDb3VudCA9IDBcbiAgICAgICAgLCBhbnlFeHByZXNzaW9ucyA9IGZhbHNlXG4gICAgICAgICwgYW55UmVsYXRpdmUgPSBmYWxzZVxuICAgICAgYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKXtcbiAgICAgICAgaWYgKCFhbnlFeHByZXNzaW9ucyAmJiBpc1Bvc3NpYmxlRGlyZWN0aXZlKG5vZGUpKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBhbnlFeHByZXNzaW9ucyA9IHRydWVcbiAgICAgICAgIFxuICAgICAgICBpZiAobm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgaWYgKGFic29sdXRlRmlyc3QpIHtcbiAgICAgICAgICAgIGlmICgvXlxcLi8udGVzdChub2RlLnNvdXJjZS52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgYW55UmVsYXRpdmUgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFueVJlbGF0aXZlKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgICBub2RlOiBub2RlLnNvdXJjZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQWJzb2x1dGUgaW1wb3J0cyBzaG91bGQgY29tZSBiZWZvcmUgcmVsYXRpdmUgaW1wb3J0cy4nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobm9uSW1wb3J0Q291bnQgPiAwKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbXBvcnQgaW4gYm9keSBvZiBtb2R1bGU7IHJlb3JkZXIgdG8gdG9wLicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub25JbXBvcnRDb3VudCsrXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuIl19