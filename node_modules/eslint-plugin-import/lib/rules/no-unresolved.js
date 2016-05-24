'use strict';

require('es6-symbol/implement');

var _resolve = require('../core/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

module.exports = function (context) {

  var ignoreRegExps = [];
  if (context.options[0] != null && context.options[0].ignore != null) {
    ignoreRegExps = context.options[0].ignore.map(function (p) {
      return new RegExp(p);
    });
  }

  function checkSourceValue(source) {
    if (source == null) return;

    if (ignoreRegExps.some(function (re) {
      return re.test(source.value);
    })) return;

    if ((0, _resolve2.default)(source.value, context) === undefined) {
      context.report(source, 'Unable to resolve path to module \'' + source.value + '\'.');
    }
  }

  // for import-y declarations
  function checkSource(node) {
    checkSourceValue(node.source);
  }

  // for CommonJS `require` calls
  // adapted from @mctep: http://git.io/v4rAu
  function checkCommon(call) {
    if (call.callee.type !== 'Identifier') return;
    if (call.callee.name !== 'require') return;
    if (call.arguments.length !== 1) return;

    var modulePath = call.arguments[0];
    if (modulePath.type !== 'Literal') return;
    if (typeof modulePath.value !== 'string') return;

    checkSourceValue(modulePath);
  }

  function checkAMD(call) {
    if (call.callee.type !== 'Identifier') return;
    if (call.callee.name !== 'require' && call.callee.name !== 'define') return;
    if (call.arguments.length !== 2) return;

    var modules = call.arguments[0];
    if (modules.type !== 'ArrayExpression') return;

    for (var _iterator = modules.elements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var element = _ref;

      if (element.type !== 'Literal') continue;
      if (typeof element.value !== 'string') continue;

      if (element.value === 'require' || element.value === 'exports') continue; // magic modules: http://git.io/vByan

      checkSourceValue(element);
    }
  }

  var visitors = {
    'ImportDeclaration': checkSource,
    'ExportNamedDeclaration': checkSource,
    'ExportAllDeclaration': checkSource
  };

  if (context.options[0] != null) {
    (function () {
      var _context$options$ = context.options[0];
      var commonjs = _context$options$.commonjs;
      var amd = _context$options$.amd;


      if (commonjs || amd) {
        visitors['CallExpression'] = function (call) {
          if (commonjs) checkCommon(call);
          if (amd) checkAMD(call);
        };
      }
    })();
  }

  return visitors;
};

module.exports.schema = [{
  'type': 'object',
  'properties': {
    'commonjs': { 'type': 'boolean' },
    'amd': { 'type': 'boolean' },
    'ignore': {
      'type': 'array',
      'minItems': 1,
      'items': { 'type': 'string' },
      'uniqueItems': true
    }
  },
  'additionalProperties': false
}];
//# sourceMappingURL=data:application/json;base64,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QStEbEMsTUFBSSxRQUFRLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsSUFBdEIsRUFBNEI7OzhCQUNKLFFBQVEsT0FBUixDQUFnQixDQUFoQjtVQUFsQjtVQUFVOzs7QUFFbEIsVUFBSSxZQUFZLEdBQVosRUFBaUI7QUFDbkIsaUJBQVMsZ0JBQVQsSUFBNkIsVUFBVSxJQUFWLEVBQWdCO0FBQzNDLGNBQUksUUFBSixFQUFjLFlBQVksSUFBWixFQUFkO0FBQ0EsY0FBSSxHQUFKLEVBQVMsU0FBUyxJQUFULEVBQVQ7U0FGMkIsQ0FEVjtPQUFyQjtTQUg4QjtHQUFoQzs7QUFXQSxTQUFPLFFBQVAsQ0ExRWtDO0NBQW5COztBQTZFakIsT0FBTyxPQUFQLENBQWUsTUFBZixHQUF3QixDQUN0QjtBQUNFLFVBQVEsUUFBUjtBQUNBLGdCQUFjO0FBQ1osZ0JBQVksRUFBRSxRQUFRLFNBQVIsRUFBZDtBQUNBLFdBQU8sRUFBRSxRQUFRLFNBQVIsRUFBVDtBQUNBLGNBQVU7QUFDUixjQUFRLE9BQVI7QUFDQSxrQkFBWSxDQUFaO0FBQ0EsZUFBUyxFQUFFLFFBQVEsUUFBUixFQUFYO0FBQ0EscUJBQWUsSUFBZjtLQUpGO0dBSEY7QUFVQSwwQkFBd0IsS0FBeEI7Q0Fib0IsQ0FBeEIiLCJmaWxlIjoicnVsZXMvbm8tdW5yZXNvbHZlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVPdmVydmlldyBFbnN1cmVzIHRoYXQgYW4gaW1wb3J0ZWQgcGF0aCBleGlzdHMsIGdpdmVuIHJlc29sdXRpb24gcnVsZXMuXG4gKiBAYXV0aG9yIEJlbiBNb3NoZXJcbiAqL1xuXG5pbXBvcnQgJ2VzNi1zeW1ib2wvaW1wbGVtZW50J1xuXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICcuLi9jb3JlL3Jlc29sdmUnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcblxuICBsZXQgaWdub3JlUmVnRXhwcyA9IFtdXG4gIGlmIChjb250ZXh0Lm9wdGlvbnNbMF0gIT0gbnVsbCAmJiBjb250ZXh0Lm9wdGlvbnNbMF0uaWdub3JlICE9IG51bGwpIHtcbiAgICBpZ25vcmVSZWdFeHBzID0gY29udGV4dC5vcHRpb25zWzBdLmlnbm9yZS5tYXAocCA9PiBuZXcgUmVnRXhwKHApKVxuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tTb3VyY2VWYWx1ZShzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlID09IG51bGwpIHJldHVyblxuXG4gICAgaWYgKGlnbm9yZVJlZ0V4cHMuc29tZShyZSA9PiByZS50ZXN0KHNvdXJjZS52YWx1ZSkpKSByZXR1cm5cblxuICAgIGlmIChyZXNvbHZlKHNvdXJjZS52YWx1ZSwgY29udGV4dCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGV4dC5yZXBvcnQoc291cmNlLFxuICAgICAgICAnVW5hYmxlIHRvIHJlc29sdmUgcGF0aCB0byBtb2R1bGUgXFwnJyArIHNvdXJjZS52YWx1ZSArICdcXCcuJylcbiAgICB9XG4gIH1cblxuICAvLyBmb3IgaW1wb3J0LXkgZGVjbGFyYXRpb25zXG4gIGZ1bmN0aW9uIGNoZWNrU291cmNlKG5vZGUpIHtcbiAgICBjaGVja1NvdXJjZVZhbHVlKG5vZGUuc291cmNlKVxuICB9XG5cbiAgLy8gZm9yIENvbW1vbkpTIGByZXF1aXJlYCBjYWxsc1xuICAvLyBhZGFwdGVkIGZyb20gQG1jdGVwOiBodHRwOi8vZ2l0LmlvL3Y0ckF1XG4gIGZ1bmN0aW9uIGNoZWNrQ29tbW9uKGNhbGwpIHtcbiAgICBpZiAoY2FsbC5jYWxsZWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICBpZiAoY2FsbC5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnKSByZXR1cm5cbiAgICBpZiAoY2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSByZXR1cm5cblxuICAgIGNvbnN0IG1vZHVsZVBhdGggPSBjYWxsLmFyZ3VtZW50c1swXVxuICAgIGlmIChtb2R1bGVQYXRoLnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGVQYXRoLnZhbHVlICE9PSAnc3RyaW5nJykgcmV0dXJuXG5cbiAgICBjaGVja1NvdXJjZVZhbHVlKG1vZHVsZVBhdGgpXG4gIH1cblxuICBmdW5jdGlvbiBjaGVja0FNRChjYWxsKSB7XG4gICAgaWYgKGNhbGwuY2FsbGVlLnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgaWYgKGNhbGwuY2FsbGVlLm5hbWUgIT09ICdyZXF1aXJlJyAmJlxuICAgICAgICBjYWxsLmNhbGxlZS5uYW1lICE9PSAnZGVmaW5lJykgcmV0dXJuXG4gICAgaWYgKGNhbGwuYXJndW1lbnRzLmxlbmd0aCAhPT0gMikgcmV0dXJuXG5cbiAgICBjb25zdCBtb2R1bGVzID0gY2FsbC5hcmd1bWVudHNbMF1cbiAgICBpZiAobW9kdWxlcy50eXBlICE9PSAnQXJyYXlFeHByZXNzaW9uJykgcmV0dXJuXG5cbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIG1vZHVsZXMuZWxlbWVudHMpIHtcbiAgICAgIGlmIChlbGVtZW50LnR5cGUgIT09ICdMaXRlcmFsJykgY29udGludWVcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudC52YWx1ZSAhPT0gJ3N0cmluZycpIGNvbnRpbnVlXG5cbiAgICAgIGlmIChlbGVtZW50LnZhbHVlID09PSAncmVxdWlyZScgfHxcbiAgICAgICAgICBlbGVtZW50LnZhbHVlID09PSAnZXhwb3J0cycpIGNvbnRpbnVlIC8vIG1hZ2ljIG1vZHVsZXM6IGh0dHA6Ly9naXQuaW8vdkJ5YW5cblxuICAgICAgY2hlY2tTb3VyY2VWYWx1ZShlbGVtZW50KVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZpc2l0b3JzID0ge1xuICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGNoZWNrU291cmNlLFxuICAgICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJzogY2hlY2tTb3VyY2UsXG4gICAgJ0V4cG9ydEFsbERlY2xhcmF0aW9uJzogY2hlY2tTb3VyY2UsXG4gIH1cblxuICBpZiAoY29udGV4dC5vcHRpb25zWzBdICE9IG51bGwpIHtcbiAgICBjb25zdCB7IGNvbW1vbmpzLCBhbWQgfSA9IGNvbnRleHQub3B0aW9uc1swXVxuXG4gICAgaWYgKGNvbW1vbmpzIHx8IGFtZCkge1xuICAgICAgdmlzaXRvcnNbJ0NhbGxFeHByZXNzaW9uJ10gPSBmdW5jdGlvbiAoY2FsbCkge1xuICAgICAgICBpZiAoY29tbW9uanMpIGNoZWNrQ29tbW9uKGNhbGwpXG4gICAgICAgIGlmIChhbWQpIGNoZWNrQU1EKGNhbGwpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZpc2l0b3JzXG59XG5cbm1vZHVsZS5leHBvcnRzLnNjaGVtYSA9IFtcbiAge1xuICAgICd0eXBlJzogJ29iamVjdCcsXG4gICAgJ3Byb3BlcnRpZXMnOiB7XG4gICAgICAnY29tbW9uanMnOiB7ICd0eXBlJzogJ2Jvb2xlYW4nIH0sXG4gICAgICAnYW1kJzogeyAndHlwZSc6ICdib29sZWFuJyB9LFxuICAgICAgJ2lnbm9yZSc6IHtcbiAgICAgICAgJ3R5cGUnOiAnYXJyYXknLFxuICAgICAgICAnbWluSXRlbXMnOiAxLFxuICAgICAgICAnaXRlbXMnOiB7ICd0eXBlJzogJ3N0cmluZycgfSxcbiAgICAgICAgJ3VuaXF1ZUl0ZW1zJzogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAnYWRkaXRpb25hbFByb3BlcnRpZXMnOiBmYWxzZSxcbiAgfSxcbl1cbiJdfQ==