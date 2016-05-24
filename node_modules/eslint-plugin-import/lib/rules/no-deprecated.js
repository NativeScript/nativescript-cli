'use strict';

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _getExports = require('../core/getExports');

var _getExports2 = _interopRequireDefault(_getExports);

var _declaredScope = require('../core/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (context) {
  var deprecated = new _es6Map2.default(),
      namespaces = new _es6Map2.default();

  function checkSpecifiers(node) {
    if (node.type !== 'ImportDeclaration') return;
    if (node.source == null) return; // local export, ignore

    var imports = _getExports2.default.get(node.source.value, context);
    if (imports == null) return;

    var moduleDeprecation = void 0;
    if (imports.doc && imports.doc.tags.some(function (t) {
      return t.title === 'deprecated' && (moduleDeprecation = t);
    })) {
      context.report({ node: node, message: message(moduleDeprecation) });
    }

    if (imports.errors.length) {
      imports.reportErrors(context, node);
      return;
    }

    node.specifiers.forEach(function (im) {
      var imported = void 0,
          local = void 0;
      switch (im.type) {

        case 'ImportNamespaceSpecifier':
          {
            if (!imports.size) return;
            namespaces.set(im.local.name, imports);
            return;
          }

        case 'ImportDefaultSpecifier':
          imported = 'default';
          local = im.local.name;
          break;

        case 'ImportSpecifier':
          imported = im.imported.name;
          local = im.local.name;
          break;

        default:
          return; // can't handle this one
      }

      // unknown thing can't be deprecated
      if (!imports.has(imported)) return;

      // capture import of deep namespace

      var _imports$get = imports.get(imported);

      var namespace = _imports$get.namespace;

      if (namespace) namespaces.set(local, namespace);

      var deprecation = getDeprecation(imports.get(imported));
      if (!deprecation) return;

      context.report({ node: im, message: message(deprecation) });

      deprecated.set(local, deprecation);
    });
  }

  return {
    'Program': function Program(_ref) {
      var body = _ref.body;
      return body.forEach(checkSpecifiers);
    },

    'Identifier': function Identifier(node) {
      if (node.parent.type === 'MemberExpression' && node.parent.property === node) {
        return; // handled by MemberExpression
      }

      // ignore specifier identifiers
      if (node.parent.type.slice(0, 6) === 'Import') return;

      if (!deprecated.has(node.name)) return;

      if ((0, _declaredScope2.default)(context, node.name) !== 'module') return;
      context.report({
        node: node,
        message: message(deprecated.get(node.name))
      });
    },

    'MemberExpression': function MemberExpression(dereference) {
      if (dereference.object.type !== 'Identifier') return;
      if (!namespaces.has(dereference.object.name)) return;

      if ((0, _declaredScope2.default)(context, dereference.object.name) !== 'module') return;

      // go deep
      var namespace = namespaces.get(dereference.object.name);
      var namepath = [dereference.object.name];
      // while property is namespace and parent is member expression, keep validating
      while (namespace instanceof _getExports2.default && dereference.type === 'MemberExpression') {

        // ignore computed parts for now
        if (dereference.computed) return;

        var metadata = namespace.get(dereference.property.name);

        if (!metadata) break;
        var deprecation = getDeprecation(metadata);

        if (deprecation) {
          context.report({ node: dereference.property, message: message(deprecation) });
        }

        // stash and pop
        namepath.push(dereference.property.name);
        namespace = metadata.namespace;
        dereference = dereference.parent;
      }
    }
  };
};

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.');
}

function getDeprecation(metadata) {
  if (!metadata || !metadata.doc) return;

  var deprecation = void 0;
  if (metadata.doc.tags.some(function (t) {
    return t.title === 'deprecated' && (deprecation = t);
  })) {
    return deprecation;
  }
}
//# sourceMappingURL=data:application/json;base64,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V0FBSixFQUFpQjtBQUNmLGtCQUFRLE1BQVIsQ0FBZSxFQUFFLE1BQU0sWUFBWSxRQUFaLEVBQXNCLFNBQVMsUUFBUSxXQUFSLENBQVQsRUFBN0MsRUFEZTtTQUFqQjs7O0FBVjhDLGdCQWU5QyxDQUFTLElBQVQsQ0FBYyxZQUFZLFFBQVosQ0FBcUIsSUFBckIsQ0FBZCxDQWY4QztBQWdCOUMsb0JBQVksU0FBUyxTQUFULENBaEJrQztBQWlCOUMsc0JBQWMsWUFBWSxNQUFaLENBakJnQztPQURoRDtLQVZrQjtHQXBCdEIsQ0EvRGtDO0NBQW5COztBQXFIakIsU0FBUyxPQUFULENBQWlCLFdBQWpCLEVBQThCO0FBQzVCLFNBQU8sZ0JBQWdCLFlBQVksV0FBWixHQUEwQixPQUFPLFlBQVksV0FBWixHQUEwQixHQUEzRCxDQUFoQixDQURxQjtDQUE5Qjs7QUFJQSxTQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBa0M7QUFDaEMsTUFBSSxDQUFDLFFBQUQsSUFBYSxDQUFDLFNBQVMsR0FBVCxFQUFjLE9BQWhDOztBQUVBLE1BQUksb0JBQUosQ0FIZ0M7QUFJaEMsTUFBSSxTQUFTLEdBQVQsQ0FBYSxJQUFiLENBQWtCLElBQWxCLENBQXVCO1dBQUssRUFBRSxLQUFGLEtBQVksWUFBWixLQUE2QixjQUFjLENBQWQsQ0FBN0I7R0FBTCxDQUEzQixFQUFnRjtBQUM5RSxXQUFPLFdBQVAsQ0FEOEU7R0FBaEY7Q0FKRiIsImZpbGUiOiJydWxlcy9uby1kZXByZWNhdGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE1hcCBmcm9tICdlczYtbWFwJ1xuXG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9jb3JlL2dldEV4cG9ydHMnXG5pbXBvcnQgZGVjbGFyZWRTY29wZSBmcm9tICcuLi9jb3JlL2RlY2xhcmVkU2NvcGUnXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgY29uc3QgZGVwcmVjYXRlZCA9IG5ldyBNYXAoKVxuICAgICAgLCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpXG5cbiAgZnVuY3Rpb24gY2hlY2tTcGVjaWZpZXJzKG5vZGUpIHtcbiAgICBpZiAobm9kZS50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm5cbiAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCkgcmV0dXJuIC8vIGxvY2FsIGV4cG9ydCwgaWdub3JlXG5cbiAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQobm9kZS5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICBsZXQgbW9kdWxlRGVwcmVjYXRpb25cbiAgICBpZiAoaW1wb3J0cy5kb2MgJiZcbiAgICAgICAgaW1wb3J0cy5kb2MudGFncy5zb21lKHQgPT4gdC50aXRsZSA9PT0gJ2RlcHJlY2F0ZWQnICYmIChtb2R1bGVEZXByZWNhdGlvbiA9IHQpKSkge1xuICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBtZXNzYWdlKG1vZHVsZURlcHJlY2F0aW9uKSB9KVxuICAgIH1cblxuICAgIGlmIChpbXBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgIGxldCBpbXBvcnRlZCwgbG9jYWxcbiAgICAgIHN3aXRjaCAoaW0udHlwZSkge1xuXG5cbiAgICAgICAgY2FzZSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzp7XG4gICAgICAgICAgaWYgKCFpbXBvcnRzLnNpemUpIHJldHVyblxuICAgICAgICAgIG5hbWVzcGFjZXMuc2V0KGltLmxvY2FsLm5hbWUsIGltcG9ydHMpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICBpbXBvcnRlZCA9ICdkZWZhdWx0J1xuICAgICAgICAgIGxvY2FsID0gaW0ubG9jYWwubmFtZVxuICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzpcbiAgICAgICAgICBpbXBvcnRlZCA9IGltLmltcG9ydGVkLm5hbWVcbiAgICAgICAgICBsb2NhbCA9IGltLmxvY2FsLm5hbWVcbiAgICAgICAgICBicmVha1xuXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiAvLyBjYW4ndCBoYW5kbGUgdGhpcyBvbmVcbiAgICAgIH1cblxuICAgICAgLy8gdW5rbm93biB0aGluZyBjYW4ndCBiZSBkZXByZWNhdGVkXG4gICAgICBpZiAoIWltcG9ydHMuaGFzKGltcG9ydGVkKSkgcmV0dXJuXG5cbiAgICAgIC8vIGNhcHR1cmUgaW1wb3J0IG9mIGRlZXAgbmFtZXNwYWNlXG4gICAgICBjb25zdCB7IG5hbWVzcGFjZSB9ID0gaW1wb3J0cy5nZXQoaW1wb3J0ZWQpXG4gICAgICBpZiAobmFtZXNwYWNlKSBuYW1lc3BhY2VzLnNldChsb2NhbCwgbmFtZXNwYWNlKVxuXG4gICAgICBjb25zdCBkZXByZWNhdGlvbiA9IGdldERlcHJlY2F0aW9uKGltcG9ydHMuZ2V0KGltcG9ydGVkKSlcbiAgICAgIGlmICghZGVwcmVjYXRpb24pIHJldHVyblxuXG4gICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGU6IGltLCBtZXNzYWdlOiBtZXNzYWdlKGRlcHJlY2F0aW9uKSB9KVxuXG4gICAgICBkZXByZWNhdGVkLnNldChsb2NhbCwgZGVwcmVjYXRpb24pXG5cbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICAnUHJvZ3JhbSc6ICh7IGJvZHkgfSkgPT4gYm9keS5mb3JFYWNoKGNoZWNrU3BlY2lmaWVycyksXG5cbiAgICAnSWRlbnRpZmllcic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBpZiAobm9kZS5wYXJlbnQudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nICYmIG5vZGUucGFyZW50LnByb3BlcnR5ID09PSBub2RlKSB7XG4gICAgICAgIHJldHVybiAvLyBoYW5kbGVkIGJ5IE1lbWJlckV4cHJlc3Npb25cbiAgICAgIH1cblxuICAgICAgLy8gaWdub3JlIHNwZWNpZmllciBpZGVudGlmaWVyc1xuICAgICAgaWYgKG5vZGUucGFyZW50LnR5cGUuc2xpY2UoMCwgNikgPT09ICdJbXBvcnQnKSByZXR1cm5cblxuICAgICAgaWYgKCFkZXByZWNhdGVkLmhhcyhub2RlLm5hbWUpKSByZXR1cm5cblxuICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgbm9kZS5uYW1lKSAhPT0gJ21vZHVsZScpIHJldHVyblxuICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICBub2RlLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlKGRlcHJlY2F0ZWQuZ2V0KG5vZGUubmFtZSkpLFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgJ01lbWJlckV4cHJlc3Npb24nOiBmdW5jdGlvbiAoZGVyZWZlcmVuY2UpIHtcbiAgICAgIGlmIChkZXJlZmVyZW5jZS5vYmplY3QudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMoZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpKSByZXR1cm5cblxuICAgICAgaWYgKGRlY2xhcmVkU2NvcGUoY29udGV4dCwgZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpICE9PSAnbW9kdWxlJykgcmV0dXJuXG5cbiAgICAgIC8vIGdvIGRlZXBcbiAgICAgIHZhciBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzLmdldChkZXJlZmVyZW5jZS5vYmplY3QubmFtZSlcbiAgICAgIHZhciBuYW1lcGF0aCA9IFtkZXJlZmVyZW5jZS5vYmplY3QubmFtZV1cbiAgICAgIC8vIHdoaWxlIHByb3BlcnR5IGlzIG5hbWVzcGFjZSBhbmQgcGFyZW50IGlzIG1lbWJlciBleHByZXNzaW9uLCBrZWVwIHZhbGlkYXRpbmdcbiAgICAgIHdoaWxlIChuYW1lc3BhY2UgaW5zdGFuY2VvZiBFeHBvcnRzICYmXG4gICAgICAgICAgICAgZGVyZWZlcmVuY2UudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKSB7XG5cbiAgICAgICAgLy8gaWdub3JlIGNvbXB1dGVkIHBhcnRzIGZvciBub3dcbiAgICAgICAgaWYgKGRlcmVmZXJlbmNlLmNvbXB1dGVkKSByZXR1cm5cblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IG5hbWVzcGFjZS5nZXQoZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSlcblxuICAgICAgICBpZiAoIW1ldGFkYXRhKSBicmVha1xuICAgICAgICBjb25zdCBkZXByZWNhdGlvbiA9IGdldERlcHJlY2F0aW9uKG1ldGFkYXRhKVxuXG4gICAgICAgIGlmIChkZXByZWNhdGlvbikge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHsgbm9kZTogZGVyZWZlcmVuY2UucHJvcGVydHksIG1lc3NhZ2U6IG1lc3NhZ2UoZGVwcmVjYXRpb24pIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdGFzaCBhbmQgcG9wXG4gICAgICAgIG5hbWVwYXRoLnB1c2goZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSlcbiAgICAgICAgbmFtZXNwYWNlID0gbWV0YWRhdGEubmFtZXNwYWNlXG4gICAgICAgIGRlcmVmZXJlbmNlID0gZGVyZWZlcmVuY2UucGFyZW50XG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiBtZXNzYWdlKGRlcHJlY2F0aW9uKSB7XG4gIHJldHVybiAnRGVwcmVjYXRlZCcgKyAoZGVwcmVjYXRpb24uZGVzY3JpcHRpb24gPyAnOiAnICsgZGVwcmVjYXRpb24uZGVzY3JpcHRpb24gOiAnLicpXG59XG5cbmZ1bmN0aW9uIGdldERlcHJlY2F0aW9uKG1ldGFkYXRhKSB7XG4gIGlmICghbWV0YWRhdGEgfHwgIW1ldGFkYXRhLmRvYykgcmV0dXJuXG5cbiAgbGV0IGRlcHJlY2F0aW9uXG4gIGlmIChtZXRhZGF0YS5kb2MudGFncy5zb21lKHQgPT4gdC50aXRsZSA9PT0gJ2RlcHJlY2F0ZWQnICYmIChkZXByZWNhdGlvbiA9IHQpKSkge1xuICAgIHJldHVybiBkZXByZWNhdGlvblxuICB9XG59XG4iXX0=