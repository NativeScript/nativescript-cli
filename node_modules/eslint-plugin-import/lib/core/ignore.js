'use strict';

exports.__esModule = true;
exports.default = ignore;

var _path = require('path');

var _es6Set = require('es6-set');

var _es6Set2 = _interopRequireDefault(_es6Set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// one-shot memoized
var cachedSet = void 0,
    lastSettings = void 0;
function validExtensions(_ref) {
  var settings = _ref.settings;

  if (cachedSet && settings === lastSettings) {
    return cachedSet;
  }

  // todo: add 'mjs'?
  lastSettings = settings;
  // breaking: default to '.js'
  // cachedSet = new Set(settings['import/extensions'] || [ '.js' ])
  cachedSet = 'import/extensions' in settings ? new _es6Set2.default(settings['import/extensions']) : { has: function has() {
      return true;
    } }; // the set of all elements

  return cachedSet;
}

function ignore(path, context) {
  // ignore node_modules by default
  var ignoreStrings = context.settings['import/ignore'] ? [].concat(context.settings['import/ignore']) : ['node_modules'];

  // check extension whitelist first (cheap)
  if (!validExtensions(context).has((0, _path.extname)(path))) return true;

  if (ignoreStrings.length === 0) return false;

  for (var i = 0; i < ignoreStrings.length; i++) {
    var regex = new RegExp(ignoreStrings[i]);
    if (regex.test(path)) return true;
  }

  return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvaWdub3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztrQkFxQndCOztBQXJCeEI7O0FBQ0E7Ozs7Ozs7QUFHQSxJQUFJLGtCQUFKO0lBQWUscUJBQWY7QUFDQSxTQUFTLGVBQVQsT0FBdUM7TUFBWix5QkFBWTs7QUFDckMsTUFBSSxhQUFhLGFBQWEsWUFBYixFQUEyQjtBQUMxQyxXQUFPLFNBQVAsQ0FEMEM7R0FBNUM7OztBQURxQyxjQU1yQyxHQUFlLFFBQWY7OztBQU5xQyxXQVNyQyxHQUFZLHVCQUF1QixRQUF2QixHQUNSLHFCQUFRLFNBQVMsbUJBQVQsQ0FBUixDQURRLEdBRVIsRUFBRSxLQUFLO2FBQU07S0FBTixFQUZDOztBQVR5QixTQWE5QixTQUFQLENBYnFDO0NBQXZDOztBQWdCZSxTQUFTLE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0IsT0FBdEIsRUFBK0I7O0FBRTVDLE1BQU0sZ0JBQWdCLFFBQVEsUUFBUixDQUFpQixlQUFqQixJQUNsQixHQUFHLE1BQUgsQ0FBVSxRQUFRLFFBQVIsQ0FBaUIsZUFBakIsQ0FBVixDQURrQixHQUVsQixDQUFDLGNBQUQsQ0FGa0I7OztBQUZzQixNQU94QyxDQUFDLGdCQUFnQixPQUFoQixFQUF5QixHQUF6QixDQUE2QixtQkFBUSxJQUFSLENBQTdCLENBQUQsRUFBOEMsT0FBTyxJQUFQLENBQWxEOztBQUVBLE1BQUksY0FBYyxNQUFkLEtBQXlCLENBQXpCLEVBQTRCLE9BQU8sS0FBUCxDQUFoQzs7QUFFQSxPQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxjQUFjLE1BQWQsRUFBc0IsR0FBMUMsRUFBK0M7QUFDN0MsUUFBSSxRQUFRLElBQUksTUFBSixDQUFXLGNBQWMsQ0FBZCxDQUFYLENBQVIsQ0FEeUM7QUFFN0MsUUFBSSxNQUFNLElBQU4sQ0FBVyxJQUFYLENBQUosRUFBc0IsT0FBTyxJQUFQLENBQXRCO0dBRkY7O0FBS0EsU0FBTyxLQUFQLENBaEI0QztDQUEvQiIsImZpbGUiOiJjb3JlL2lnbm9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4dG5hbWUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IFNldCBmcm9tICdlczYtc2V0J1xuXG4vLyBvbmUtc2hvdCBtZW1vaXplZFxubGV0IGNhY2hlZFNldCwgbGFzdFNldHRpbmdzXG5mdW5jdGlvbiB2YWxpZEV4dGVuc2lvbnMoeyBzZXR0aW5ncyB9KSB7XG4gIGlmIChjYWNoZWRTZXQgJiYgc2V0dGluZ3MgPT09IGxhc3RTZXR0aW5ncykge1xuICAgIHJldHVybiBjYWNoZWRTZXRcbiAgfVxuXG4gIC8vIHRvZG86IGFkZCAnbWpzJz9cbiAgbGFzdFNldHRpbmdzID0gc2V0dGluZ3NcbiAgLy8gYnJlYWtpbmc6IGRlZmF1bHQgdG8gJy5qcydcbiAgLy8gY2FjaGVkU2V0ID0gbmV3IFNldChzZXR0aW5nc1snaW1wb3J0L2V4dGVuc2lvbnMnXSB8fCBbICcuanMnIF0pXG4gIGNhY2hlZFNldCA9ICdpbXBvcnQvZXh0ZW5zaW9ucycgaW4gc2V0dGluZ3NcbiAgICA/IG5ldyBTZXQoc2V0dGluZ3NbJ2ltcG9ydC9leHRlbnNpb25zJ10pXG4gICAgOiB7IGhhczogKCkgPT4gdHJ1ZSB9IC8vIHRoZSBzZXQgb2YgYWxsIGVsZW1lbnRzXG5cbiAgcmV0dXJuIGNhY2hlZFNldFxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpZ25vcmUocGF0aCwgY29udGV4dCkge1xuICAvLyBpZ25vcmUgbm9kZV9tb2R1bGVzIGJ5IGRlZmF1bHRcbiAgY29uc3QgaWdub3JlU3RyaW5ncyA9IGNvbnRleHQuc2V0dGluZ3NbJ2ltcG9ydC9pZ25vcmUnXVxuICAgID8gW10uY29uY2F0KGNvbnRleHQuc2V0dGluZ3NbJ2ltcG9ydC9pZ25vcmUnXSlcbiAgICA6IFsnbm9kZV9tb2R1bGVzJ11cblxuICAvLyBjaGVjayBleHRlbnNpb24gd2hpdGVsaXN0IGZpcnN0IChjaGVhcClcbiAgaWYgKCF2YWxpZEV4dGVuc2lvbnMoY29udGV4dCkuaGFzKGV4dG5hbWUocGF0aCkpKSByZXR1cm4gdHJ1ZVxuXG4gIGlmIChpZ25vcmVTdHJpbmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBpZ25vcmVTdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChpZ25vcmVTdHJpbmdzW2ldKVxuICAgIGlmIChyZWdleC50ZXN0KHBhdGgpKSByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG4iXX0=