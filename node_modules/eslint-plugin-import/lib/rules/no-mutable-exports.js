'use strict';

module.exports = function (context) {
  function checkDeclaration(node) {
    var kind = node.kind;

    if (kind === 'var' || kind === 'let') {
      context.report(node, 'Exporting mutable \'' + kind + '\' binding, use \'const\' instead.');
    }
  }

  function checkDeclarationsInScope(_ref, name) {
    var variables = _ref.variables;

    for (var _iterator = variables, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref2 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref2 = _i.value;
      }

      var variable = _ref2;

      if (variable.name === name) {
        for (var _iterator2 = variable.defs, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref3 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref3 = _i2.value;
          }

          var def = _ref3;

          if (def.type === 'Variable') {
            checkDeclaration(def.parent);
          }
        }
      }
    }
  }

  function handleExportDefault(node) {
    var scope = context.getScope();

    if (node.declaration.name) {
      checkDeclarationsInScope(scope, node.declaration.name);
    }
  }

  function handleExportNamed(node) {
    var scope = context.getScope();

    if (node.declaration) {
      checkDeclaration(node.declaration);
    } else if (!node.source) {
      for (var _iterator3 = node.specifiers, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref4;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref4 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref4 = _i3.value;
        }

        var specifier = _ref4;

        checkDeclarationsInScope(scope, specifier.local.name);
      }
    }
  }

  return {
    'ExportDefaultDeclaration': handleExportDefault,
    'ExportNamedDeclaration': handleExportNamed
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW11dGFibGUtZXhwb3J0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE9BQU8sT0FBUCxHQUFpQixVQUFVLE9BQVYsRUFBbUI7QUFDbEMsV0FBUyxnQkFBVCxDQUEwQixJQUExQixFQUFnQztRQUN2QixPQUFRLEtBQVIsS0FEdUI7O0FBRTlCLFFBQUksU0FBUyxLQUFULElBQWtCLFNBQVMsS0FBVCxFQUFnQjtBQUNwQyxjQUFRLE1BQVIsQ0FBZSxJQUFmLDJCQUEyQywyQ0FBM0MsRUFEb0M7S0FBdEM7R0FGRjs7QUFPQSxXQUFTLHdCQUFULE9BQStDLElBQS9DLEVBQXFEO1FBQWxCLDJCQUFrQjs7QUFDbkQseUJBQXFCLHVIQUFyQixJQUFnQzs7Ozs7Ozs7Ozs7O1VBQXZCLGlCQUF1Qjs7QUFDOUIsVUFBSSxTQUFTLElBQVQsS0FBa0IsSUFBbEIsRUFBd0I7QUFDMUIsOEJBQWdCLFNBQVMsSUFBVCxxSEFBaEIsSUFBK0I7Ozs7Ozs7Ozs7OztjQUF0QixZQUFzQjs7QUFDN0IsY0FBSSxJQUFJLElBQUosS0FBYSxVQUFiLEVBQXlCO0FBQzNCLDZCQUFpQixJQUFJLE1BQUosQ0FBakIsQ0FEMkI7V0FBN0I7U0FERjtPQURGO0tBREY7R0FERjs7QUFZQSxXQUFTLG1CQUFULENBQTZCLElBQTdCLEVBQW1DO0FBQ2pDLFFBQU0sUUFBUSxRQUFRLFFBQVIsRUFBUixDQUQyQjs7QUFHakMsUUFBSSxLQUFLLFdBQUwsQ0FBaUIsSUFBakIsRUFBdUI7QUFDekIsK0JBQXlCLEtBQXpCLEVBQWdDLEtBQUssV0FBTCxDQUFpQixJQUFqQixDQUFoQyxDQUR5QjtLQUEzQjtHQUhGOztBQVFBLFdBQVMsaUJBQVQsQ0FBMkIsSUFBM0IsRUFBaUM7QUFDL0IsUUFBTSxRQUFRLFFBQVEsUUFBUixFQUFSLENBRHlCOztBQUcvQixRQUFJLEtBQUssV0FBTCxFQUFtQjtBQUNyQix1QkFBaUIsS0FBSyxXQUFMLENBQWpCLENBRHFCO0tBQXZCLE1BRU8sSUFBSSxDQUFDLEtBQUssTUFBTCxFQUFhO0FBQ3ZCLDRCQUFzQixLQUFLLFVBQUwscUhBQXRCLElBQXVDOzs7Ozs7Ozs7Ozs7WUFBOUIsa0JBQThCOztBQUNyQyxpQ0FBeUIsS0FBekIsRUFBZ0MsVUFBVSxLQUFWLENBQWdCLElBQWhCLENBQWhDLENBRHFDO09BQXZDO0tBREs7R0FMVDs7QUFZQSxTQUFPO0FBQ0wsZ0NBQTRCLG1CQUE1QjtBQUNBLDhCQUEwQixpQkFBMUI7R0FGRixDQXhDa0M7Q0FBbkIiLCJmaWxlIjoicnVsZXMvbm8tbXV0YWJsZS1leHBvcnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBmdW5jdGlvbiBjaGVja0RlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICBjb25zdCB7a2luZH0gPSBub2RlXG4gICAgaWYgKGtpbmQgPT09ICd2YXInIHx8IGtpbmQgPT09ICdsZXQnKSB7XG4gICAgICBjb250ZXh0LnJlcG9ydChub2RlLCBgRXhwb3J0aW5nIG11dGFibGUgJyR7a2luZH0nIGJpbmRpbmcsIHVzZSAnY29uc3QnIGluc3RlYWQuYClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjaGVja0RlY2xhcmF0aW9uc0luU2NvcGUoe3ZhcmlhYmxlc30sIG5hbWUpIHtcbiAgICBmb3IgKGxldCB2YXJpYWJsZSBvZiB2YXJpYWJsZXMpIHtcbiAgICAgIGlmICh2YXJpYWJsZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgIGZvciAobGV0IGRlZiBvZiB2YXJpYWJsZS5kZWZzKSB7XG4gICAgICAgICAgaWYgKGRlZi50eXBlID09PSAnVmFyaWFibGUnKSB7XG4gICAgICAgICAgICBjaGVja0RlY2xhcmF0aW9uKGRlZi5wYXJlbnQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlRXhwb3J0RGVmYXVsdChub2RlKSB7XG4gICAgY29uc3Qgc2NvcGUgPSBjb250ZXh0LmdldFNjb3BlKClcblxuICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgIGNoZWNrRGVjbGFyYXRpb25zSW5TY29wZShzY29wZSwgbm9kZS5kZWNsYXJhdGlvbi5uYW1lKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUV4cG9ydE5hbWVkKG5vZGUpIHtcbiAgICBjb25zdCBzY29wZSA9IGNvbnRleHQuZ2V0U2NvcGUoKVxuXG4gICAgaWYgKG5vZGUuZGVjbGFyYXRpb24pICB7XG4gICAgICBjaGVja0RlY2xhcmF0aW9uKG5vZGUuZGVjbGFyYXRpb24pXG4gICAgfSBlbHNlIGlmICghbm9kZS5zb3VyY2UpIHtcbiAgICAgIGZvciAobGV0IHNwZWNpZmllciBvZiBub2RlLnNwZWNpZmllcnMpIHtcbiAgICAgICAgY2hlY2tEZWNsYXJhdGlvbnNJblNjb3BlKHNjb3BlLCBzcGVjaWZpZXIubG9jYWwubmFtZSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nOiBoYW5kbGVFeHBvcnREZWZhdWx0LFxuICAgICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJzogaGFuZGxlRXhwb3J0TmFtZWQsXG4gIH1cbn1cbiJdfQ==