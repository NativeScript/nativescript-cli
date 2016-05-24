'use strict';

exports.__esModule = true;

exports.default = function (content, context) {

  if (context == null) throw new Error('need context to parse properly');

  var parserOptions = context.parserOptions;
  var parserPath = context.parserPath;


  if (!parserPath) throw new Error('parserPath is required!');

  // hack: espree blows up with frozen options
  parserOptions = (0, _objectAssign2.default)({}, parserOptions);
  parserOptions.ecmaFeatures = (0, _objectAssign2.default)({}, parserOptions.ecmaFeatures);

  // always attach comments
  parserOptions.attachComment = true;

  // require the parser relative to the main module (i.e., ESLint)
  var parser = (0, _moduleRequire2.default)(parserPath);

  return parser.parse(content, parserOptions);
};

var _moduleRequire = require('./module-require');

var _moduleRequire2 = _interopRequireDefault(_moduleRequire);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvcGFyc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztrQkFHZSxVQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEI7O0FBRXpDLE1BQUksV0FBVyxJQUFYLEVBQWlCLE1BQU0sSUFBSSxLQUFKLENBQVUsZ0NBQVYsQ0FBTixDQUFyQjs7TUFFTSxnQkFBOEIsUUFBOUIsY0FKbUM7TUFJcEIsYUFBZSxRQUFmLFdBSm9COzs7QUFNekMsTUFBSSxDQUFDLFVBQUQsRUFBYSxNQUFNLElBQUksS0FBSixDQUFVLHlCQUFWLENBQU4sQ0FBakI7OztBQU55QyxlQVN6QyxHQUFnQiw0QkFBTyxFQUFQLEVBQVcsYUFBWCxDQUFoQixDQVR5QztBQVV6QyxnQkFBYyxZQUFkLEdBQTZCLDRCQUFPLEVBQVAsRUFBVyxjQUFjLFlBQWQsQ0FBeEM7OztBQVZ5QyxlQWF6QyxDQUFjLGFBQWQsR0FBOEIsSUFBOUI7OztBQWJ5QyxNQWdCbkMsU0FBUyw2QkFBYyxVQUFkLENBQVQsQ0FoQm1DOztBQWtCekMsU0FBTyxPQUFPLEtBQVAsQ0FBYSxPQUFiLEVBQXNCLGFBQXRCLENBQVAsQ0FsQnlDO0NBQTVCOztBQUhmOzs7O0FBQ0EiLCJmaWxlIjoiY29yZS9wYXJzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb2R1bGVSZXF1aXJlIGZyb20gJy4vbW9kdWxlLXJlcXVpcmUnXG5pbXBvcnQgYXNzaWduIGZyb20gJ29iamVjdC1hc3NpZ24nXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChjb250ZW50LCBjb250ZXh0KSB7XG5cbiAgaWYgKGNvbnRleHQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCduZWVkIGNvbnRleHQgdG8gcGFyc2UgcHJvcGVybHknKVxuXG4gIGxldCB7IHBhcnNlck9wdGlvbnMsIHBhcnNlclBhdGggfSA9IGNvbnRleHRcblxuICBpZiAoIXBhcnNlclBhdGgpIHRocm93IG5ldyBFcnJvcigncGFyc2VyUGF0aCBpcyByZXF1aXJlZCEnKVxuXG4gIC8vIGhhY2s6IGVzcHJlZSBibG93cyB1cCB3aXRoIGZyb3plbiBvcHRpb25zXG4gIHBhcnNlck9wdGlvbnMgPSBhc3NpZ24oe30sIHBhcnNlck9wdGlvbnMpXG4gIHBhcnNlck9wdGlvbnMuZWNtYUZlYXR1cmVzID0gYXNzaWduKHt9LCBwYXJzZXJPcHRpb25zLmVjbWFGZWF0dXJlcylcblxuICAvLyBhbHdheXMgYXR0YWNoIGNvbW1lbnRzXG4gIHBhcnNlck9wdGlvbnMuYXR0YWNoQ29tbWVudCA9IHRydWVcblxuICAvLyByZXF1aXJlIHRoZSBwYXJzZXIgcmVsYXRpdmUgdG8gdGhlIG1haW4gbW9kdWxlIChpLmUuLCBFU0xpbnQpXG4gIGNvbnN0IHBhcnNlciA9IG1vZHVsZVJlcXVpcmUocGFyc2VyUGF0aClcblxuICByZXR1cm4gcGFyc2VyLnBhcnNlKGNvbnRlbnQsIHBhcnNlck9wdGlvbnMpXG59XG4iXX0=