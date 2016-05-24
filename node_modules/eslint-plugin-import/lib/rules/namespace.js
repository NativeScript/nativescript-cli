'use strict';

require('es6-symbol/implement');

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _declaredScope = require('../core/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {

  var namespaces = new _es6Map2.default();

  function makeMessage(last, namepath) {
    return '\'' + last.name + '\' not found in' + (namepath.length > 1 ? ' deeply ' : ' ') + ('imported namespace \'' + namepath.join('.') + '\'.');
  }

  return {

    // pick up all imports at body entry time, to properly respect hoisting
    'Program': function Program(_ref) {
      var body = _ref.body;

      function processBodyStatement(declaration) {
        if (declaration.type !== 'ImportDeclaration') return;

        if (declaration.specifiers.length === 0) return;

        var imports = _getExports2.default.get(declaration.source.value, context);
        if (imports == null) return null;

        if (imports.errors.length) {
          imports.reportErrors(context, declaration);
          return;
        }

        for (var _iterator = declaration.specifiers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref2 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref2 = _i.value;
          }

          var specifier = _ref2;

          switch (specifier.type) {
            case 'ImportNamespaceSpecifier':
              if (!imports.size) {
                context.report(specifier, 'No exported names found in module \'' + declaration.source.value + '\'.');
              }
              namespaces.set(specifier.local.name, imports);
              break;
            case 'ImportDefaultSpecifier':
            case 'ImportSpecifier':
              {
                var meta = imports.get(
                // default to 'default' for default http://i.imgur.com/nj6qAWy.jpg
                specifier.imported ? specifier.imported.name : 'default');
                if (!meta || !meta.namespace) break;
                namespaces.set(specifier.local.name, meta.namespace);
                break;
              }
          }
        }
      }
      body.forEach(processBodyStatement);
    },

    // same as above, but does not add names to local map
    'ExportNamespaceSpecifier': function ExportNamespaceSpecifier(namespace) {
      var declaration = (0, _importDeclaration2.default)(context);

      var imports = _getExports2.default.get(declaration.source.value, context);
      if (imports == null) return null;

      if (imports.errors.length) {
        imports.reportErrors(context, declaration);
        return;
      }

      if (!imports.size) {
        context.report(namespace, 'No exported names found in module \'' + declaration.source.value + '\'.');
      }
    },

    // todo: check for possible redefinition

    'MemberExpression': function MemberExpression(dereference) {
      if (dereference.object.type !== 'Identifier') return;
      if (!namespaces.has(dereference.object.name)) return;

      if (dereference.parent.type === 'AssignmentExpression' && dereference.parent.left === dereference) {
        context.report(dereference.parent, 'Assignment to member of namespace \'' + dereference.object.name + '\'.');
      }

      // go deep
      var namespace = namespaces.get(dereference.object.name);
      var namepath = [dereference.object.name];
      // while property is namespace and parent is member expression, keep validating
      while (namespace instanceof _getExports2.default && dereference.type === 'MemberExpression') {

        if (dereference.computed) {
          context.report(dereference.property, 'Unable to validate computed reference to imported namespace \'' + dereference.object.name + '\'.');
          return;
        }

        if (!namespace.has(dereference.property.name)) {
          context.report(dereference.property, makeMessage(dereference.property, namepath));
          break;
        }

        // stash and pop
        namepath.push(dereference.property.name);
        namespace = namespace.get(dereference.property.name).namespace;
        dereference = dereference.parent;
      }
    },

    'VariableDeclarator': function VariableDeclarator(_ref3) {
      var id = _ref3.id;
      var init = _ref3.init;

      if (init == null) return;
      if (init.type !== 'Identifier') return;
      if (!namespaces.has(init.name)) return;

      // check for redefinition in intermediate scopes
      if ((0, _declaredScope2.default)(context, init.name) !== 'module') return;

      // DFS traverse child namespaces
      function testKey(pattern, namespace) {
        var path = arguments.length <= 2 || arguments[2] === undefined ? [init.name] : arguments[2];

        if (!(namespace instanceof _getExports2.default)) return;

        if (pattern.type !== 'ObjectPattern') return;

        for (var _iterator2 = pattern.properties, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref4;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref4 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref4 = _i2.value;
          }

          var property = _ref4;


          if (property.key.type !== 'Identifier') {
            context.report({
              node: property,
              message: 'Only destructure top-level names.'
            });
            continue;
          }

          if (!namespace.has(property.key.name)) {
            context.report({
              node: property,
              message: makeMessage(property.key, path)
            });
            continue;
          }

          path.push(property.key.name);
          testKey(property.value, namespace.get(property.key.name).namespace, path);
          path.pop();
        }
      }

      testKey(id, namespaces.get(init.name));
    }
  };
};
//# sourceMappingURL=data:application/json;base64,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U0FBUyxLQUFULEVBQWdCLFVBQVUsR0FBVixDQUFjLFNBQVMsR0FBVCxDQUFhLElBQWIsQ0FBZCxDQUFpQyxTQUFqQyxFQUE0QyxJQUFwRSxFQW5CdUM7QUFvQnZDLGVBQUssR0FBTCxHQXBCdUM7U0FBekM7T0FMRjs7QUE2QkEsY0FBUSxFQUFSLEVBQVksV0FBVyxHQUFYLENBQWUsS0FBSyxJQUFMLENBQTNCLEVBdEM0QztLQUF4QjtHQXBHeEIsQ0FWa0M7Q0FBbkIiLCJmaWxlIjoicnVsZXMvbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdlczYtc3ltYm9sL2ltcGxlbWVudCdcbmltcG9ydCBNYXAgZnJvbSAnZXM2LW1hcCdcblxuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vY29yZS9nZXRFeHBvcnRzJ1xuaW1wb3J0IGltcG9ydERlY2xhcmF0aW9uIGZyb20gJy4uL2ltcG9ydERlY2xhcmF0aW9uJ1xuaW1wb3J0IGRlY2xhcmVkU2NvcGUgZnJvbSAnLi4vY29yZS9kZWNsYXJlZFNjb3BlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG5cbiAgY29uc3QgbmFtZXNwYWNlcyA9IG5ldyBNYXAoKVxuXG4gIGZ1bmN0aW9uIG1ha2VNZXNzYWdlKGxhc3QsIG5hbWVwYXRoKSB7XG4gICAgIHJldHVybiBgJyR7bGFzdC5uYW1lfScgbm90IGZvdW5kIGluYCArXG4gICAgICAgICAgICAobmFtZXBhdGgubGVuZ3RoID4gMSA/ICcgZGVlcGx5ICcgOiAnICcpICtcbiAgICAgICAgICAgIGBpbXBvcnRlZCBuYW1lc3BhY2UgJyR7bmFtZXBhdGguam9pbignLicpfScuYFxuICB9XG5cbiAgcmV0dXJuIHtcblxuICAgIC8vIHBpY2sgdXAgYWxsIGltcG9ydHMgYXQgYm9keSBlbnRyeSB0aW1lLCB0byBwcm9wZXJseSByZXNwZWN0IGhvaXN0aW5nXG4gICAgJ1Byb2dyYW0nOiBmdW5jdGlvbiAoeyBib2R5IH0pIHtcbiAgICAgIGZ1bmN0aW9uIHByb2Nlc3NCb2R5U3RhdGVtZW50KGRlY2xhcmF0aW9uKSB7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm5cblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24uc3BlY2lmaWVycy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgc3BlY2lmaWVyIG9mIGRlY2xhcmF0aW9uLnNwZWNpZmllcnMpIHtcbiAgICAgICAgICBzd2l0Y2ggKHNwZWNpZmllci50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInOlxuICAgICAgICAgICAgICBpZiAoIWltcG9ydHMuc2l6ZSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHNwZWNpZmllcixcbiAgICAgICAgICAgICAgICAgIGBObyBleHBvcnRlZCBuYW1lcyBmb3VuZCBpbiBtb2R1bGUgJyR7ZGVjbGFyYXRpb24uc291cmNlLnZhbHVlfScuYClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBuYW1lc3BhY2VzLnNldChzcGVjaWZpZXIubG9jYWwubmFtZSwgaW1wb3J0cylcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInOlxuICAgICAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzoge1xuICAgICAgICAgICAgICBjb25zdCBtZXRhID0gaW1wb3J0cy5nZXQoXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byAnZGVmYXVsdCcgZm9yIGRlZmF1bHQgaHR0cDovL2kuaW1ndXIuY29tL25qNnFBV3kuanBnXG4gICAgICAgICAgICAgICAgc3BlY2lmaWVyLmltcG9ydGVkID8gc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUgOiAnZGVmYXVsdCcpXG4gICAgICAgICAgICAgIGlmICghbWV0YSB8fCAhbWV0YS5uYW1lc3BhY2UpIGJyZWFrXG4gICAgICAgICAgICAgIG5hbWVzcGFjZXMuc2V0KHNwZWNpZmllci5sb2NhbC5uYW1lLCBtZXRhLm5hbWVzcGFjZSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJvZHkuZm9yRWFjaChwcm9jZXNzQm9keVN0YXRlbWVudClcbiAgICB9LFxuXG4gICAgLy8gc2FtZSBhcyBhYm92ZSwgYnV0IGRvZXMgbm90IGFkZCBuYW1lcyB0byBsb2NhbCBtYXBcbiAgICAnRXhwb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzogZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xuICAgICAgdmFyIGRlY2xhcmF0aW9uID0gaW1wb3J0RGVjbGFyYXRpb24oY29udGV4dClcblxuICAgICAgdmFyIGltcG9ydHMgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgICBpZiAoaW1wb3J0cyA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKCFpbXBvcnRzLnNpemUpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQobmFtZXNwYWNlLFxuICAgICAgICAgIGBObyBleHBvcnRlZCBuYW1lcyBmb3VuZCBpbiBtb2R1bGUgJyR7ZGVjbGFyYXRpb24uc291cmNlLnZhbHVlfScuYClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gdG9kbzogY2hlY2sgZm9yIHBvc3NpYmxlIHJlZGVmaW5pdGlvblxuXG4gICAgJ01lbWJlckV4cHJlc3Npb24nOiBmdW5jdGlvbiAoZGVyZWZlcmVuY2UpIHtcbiAgICAgIGlmIChkZXJlZmVyZW5jZS5vYmplY3QudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMoZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpKSByZXR1cm5cblxuICAgICAgaWYgKGRlcmVmZXJlbmNlLnBhcmVudC50eXBlID09PSAnQXNzaWdubWVudEV4cHJlc3Npb24nICYmXG4gICAgICAgICAgZGVyZWZlcmVuY2UucGFyZW50LmxlZnQgPT09IGRlcmVmZXJlbmNlKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoZGVyZWZlcmVuY2UucGFyZW50LFxuICAgICAgICAgICAgICBgQXNzaWdubWVudCB0byBtZW1iZXIgb2YgbmFtZXNwYWNlICcke2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lfScuYClcbiAgICAgIH1cblxuICAgICAgLy8gZ28gZGVlcFxuICAgICAgdmFyIG5hbWVzcGFjZSA9IG5hbWVzcGFjZXMuZ2V0KGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lKVxuICAgICAgdmFyIG5hbWVwYXRoID0gW2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lXVxuICAgICAgLy8gd2hpbGUgcHJvcGVydHkgaXMgbmFtZXNwYWNlIGFuZCBwYXJlbnQgaXMgbWVtYmVyIGV4cHJlc3Npb24sIGtlZXAgdmFsaWRhdGluZ1xuICAgICAgd2hpbGUgKG5hbWVzcGFjZSBpbnN0YW5jZW9mIEV4cG9ydHMgJiZcbiAgICAgICAgICAgICBkZXJlZmVyZW5jZS50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcblxuICAgICAgICBpZiAoZGVyZWZlcmVuY2UuY29tcHV0ZWQpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChkZXJlZmVyZW5jZS5wcm9wZXJ0eSxcbiAgICAgICAgICAgICdVbmFibGUgdG8gdmFsaWRhdGUgY29tcHV0ZWQgcmVmZXJlbmNlIHRvIGltcG9ydGVkIG5hbWVzcGFjZSBcXCcnICtcbiAgICAgICAgICAgIGRlcmVmZXJlbmNlLm9iamVjdC5uYW1lICsgJ1xcJy4nKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFuYW1lc3BhY2UuaGFzKGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICBkZXJlZmVyZW5jZS5wcm9wZXJ0eSxcbiAgICAgICAgICAgIG1ha2VNZXNzYWdlKGRlcmVmZXJlbmNlLnByb3BlcnR5LCBuYW1lcGF0aCkpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0YXNoIGFuZCBwb3BcbiAgICAgICAgbmFtZXBhdGgucHVzaChkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKVxuICAgICAgICBuYW1lc3BhY2UgPSBuYW1lc3BhY2UuZ2V0KGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpLm5hbWVzcGFjZVxuICAgICAgICBkZXJlZmVyZW5jZSA9IGRlcmVmZXJlbmNlLnBhcmVudFxuICAgICAgfVxuXG4gICAgfSxcblxuICAgICdWYXJpYWJsZURlY2xhcmF0b3InOiBmdW5jdGlvbiAoeyBpZCwgaW5pdCB9KSB7XG4gICAgICBpZiAoaW5pdCA9PSBudWxsKSByZXR1cm5cbiAgICAgIGlmIChpbml0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGluaXQubmFtZSkpIHJldHVyblxuXG4gICAgICAvLyBjaGVjayBmb3IgcmVkZWZpbml0aW9uIGluIGludGVybWVkaWF0ZSBzY29wZXNcbiAgICAgIGlmIChkZWNsYXJlZFNjb3BlKGNvbnRleHQsIGluaXQubmFtZSkgIT09ICdtb2R1bGUnKSByZXR1cm5cblxuICAgICAgLy8gREZTIHRyYXZlcnNlIGNoaWxkIG5hbWVzcGFjZXNcbiAgICAgIGZ1bmN0aW9uIHRlc3RLZXkocGF0dGVybiwgbmFtZXNwYWNlLCBwYXRoID0gW2luaXQubmFtZV0pIHtcbiAgICAgICAgaWYgKCEobmFtZXNwYWNlIGluc3RhbmNlb2YgRXhwb3J0cykpIHJldHVyblxuXG4gICAgICAgIGlmIChwYXR0ZXJuLnR5cGUgIT09ICdPYmplY3RQYXR0ZXJuJykgcmV0dXJuXG5cbiAgICAgICAgZm9yIChsZXQgcHJvcGVydHkgb2YgcGF0dGVybi5wcm9wZXJ0aWVzKSB7XG5cbiAgICAgICAgICBpZiAocHJvcGVydHkua2V5LnR5cGUgIT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgICBub2RlOiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ09ubHkgZGVzdHJ1Y3R1cmUgdG9wLWxldmVsIG5hbWVzLicsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIW5hbWVzcGFjZS5oYXMocHJvcGVydHkua2V5Lm5hbWUpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgIG5vZGU6IHByb3BlcnR5LFxuICAgICAgICAgICAgICBtZXNzYWdlOiBtYWtlTWVzc2FnZShwcm9wZXJ0eS5rZXksIHBhdGgpLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0aC5wdXNoKHByb3BlcnR5LmtleS5uYW1lKVxuICAgICAgICAgIHRlc3RLZXkocHJvcGVydHkudmFsdWUsIG5hbWVzcGFjZS5nZXQocHJvcGVydHkua2V5Lm5hbWUpLm5hbWVzcGFjZSwgcGF0aClcbiAgICAgICAgICBwYXRoLnBvcCgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGVzdEtleShpZCwgbmFtZXNwYWNlcy5nZXQoaW5pdC5uYW1lKSlcbiAgICB9LFxuICB9XG59XG4iXX0=