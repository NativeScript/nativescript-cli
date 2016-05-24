'use strict';

exports.__esModule = true;
var rules = exports.rules = {
  'no-unresolved': require('./rules/no-unresolved'),
  'named': require('./rules/named'),
  'default': require('./rules/default'),
  'namespace': require('./rules/namespace'),
  'no-namespace': require('./rules/no-namespace'),
  'export': require('./rules/export'),
  'no-mutable-exports': require('./rules/no-mutable-exports'),
  'extensions': require('./rules/extensions'),

  'no-named-as-default': require('./rules/no-named-as-default'),
  'no-named-as-default-member': require('./rules/no-named-as-default-member'),

  'no-commonjs': require('./rules/no-commonjs'),
  'no-amd': require('./rules/no-amd'),
  'no-duplicates': require('./rules/no-duplicates'),
  'imports-first': require('./rules/imports-first'),
  'no-extraneous-dependencies': require('./rules/no-extraneous-dependencies'),
  'no-nodejs-modules': require('./rules/no-nodejs-modules'),
  'order': require('./rules/order'),
  'newline-after-import': require('./rules/newline-after-import'),
  'prefer-default-export': require('./rules/prefer-default-export'),

  // metadata-based
  'no-deprecated': require('./rules/no-deprecated')
};

var configs = exports.configs = {
  'errors': require('../config/errors'),
  'warnings': require('../config/warnings'),

  // useful stuff for folks using React
  'react': require('../config/react'),

  // shhhh... work in progress "secret" rules
  'stage-0': require('../config/stage-0')
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFPLElBQU0sd0JBQVE7QUFDbkIsbUJBQWlCLFFBQVEsdUJBQVIsQ0FBakI7QUFDQSxXQUFTLFFBQVEsZUFBUixDQUFUO0FBQ0EsYUFBVyxRQUFRLGlCQUFSLENBQVg7QUFDQSxlQUFhLFFBQVEsbUJBQVIsQ0FBYjtBQUNBLGtCQUFnQixRQUFRLHNCQUFSLENBQWhCO0FBQ0EsWUFBVSxRQUFRLGdCQUFSLENBQVY7QUFDQSx3QkFBc0IsUUFBUSw0QkFBUixDQUF0QjtBQUNBLGdCQUFjLFFBQVEsb0JBQVIsQ0FBZDs7QUFFQSx5QkFBdUIsUUFBUSw2QkFBUixDQUF2QjtBQUNBLGdDQUE4QixRQUFRLG9DQUFSLENBQTlCOztBQUVBLGlCQUFlLFFBQVEscUJBQVIsQ0FBZjtBQUNBLFlBQVUsUUFBUSxnQkFBUixDQUFWO0FBQ0EsbUJBQWlCLFFBQVEsdUJBQVIsQ0FBakI7QUFDQSxtQkFBaUIsUUFBUSx1QkFBUixDQUFqQjtBQUNBLGdDQUE4QixRQUFRLG9DQUFSLENBQTlCO0FBQ0EsdUJBQXFCLFFBQVEsMkJBQVIsQ0FBckI7QUFDQSxXQUFTLFFBQVEsZUFBUixDQUFUO0FBQ0EsMEJBQXdCLFFBQVEsOEJBQVIsQ0FBeEI7QUFDQSwyQkFBeUIsUUFBUSwrQkFBUixDQUF6Qjs7O0FBR0EsbUJBQWlCLFFBQVEsdUJBQVIsQ0FBakI7Q0F4Qlc7O0FBMkJOLElBQU0sNEJBQVU7QUFDckIsWUFBVSxRQUFRLGtCQUFSLENBQVY7QUFDQSxjQUFZLFFBQVEsb0JBQVIsQ0FBWjs7O0FBR0EsV0FBUyxRQUFRLGlCQUFSLENBQVQ7OztBQUdBLGFBQVcsUUFBUSxtQkFBUixDQUFYO0NBUlciLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgcnVsZXMgPSB7XG4gICduby11bnJlc29sdmVkJzogcmVxdWlyZSgnLi9ydWxlcy9uby11bnJlc29sdmVkJyksXG4gICduYW1lZCc6IHJlcXVpcmUoJy4vcnVsZXMvbmFtZWQnKSxcbiAgJ2RlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL2RlZmF1bHQnKSxcbiAgJ25hbWVzcGFjZSc6IHJlcXVpcmUoJy4vcnVsZXMvbmFtZXNwYWNlJyksXG4gICduby1uYW1lc3BhY2UnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVzcGFjZScpLFxuICAnZXhwb3J0JzogcmVxdWlyZSgnLi9ydWxlcy9leHBvcnQnKSxcbiAgJ25vLW11dGFibGUtZXhwb3J0cyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tbXV0YWJsZS1leHBvcnRzJyksXG4gICdleHRlbnNpb25zJzogcmVxdWlyZSgnLi9ydWxlcy9leHRlbnNpb25zJyksXG5cbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVkLWFzLWRlZmF1bHQnKSxcbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQtbWVtYmVyJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlcicpLFxuXG4gICduby1jb21tb25qcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tY29tbW9uanMnKSxcbiAgJ25vLWFtZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tYW1kJyksXG4gICduby1kdXBsaWNhdGVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1kdXBsaWNhdGVzJyksXG4gICdpbXBvcnRzLWZpcnN0JzogcmVxdWlyZSgnLi9ydWxlcy9pbXBvcnRzLWZpcnN0JyksXG4gICduby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXMnKSxcbiAgJ25vLW5vZGVqcy1tb2R1bGVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1ub2RlanMtbW9kdWxlcycpLFxuICAnb3JkZXInOiByZXF1aXJlKCcuL3J1bGVzL29yZGVyJyksXG4gICduZXdsaW5lLWFmdGVyLWltcG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbmV3bGluZS1hZnRlci1pbXBvcnQnKSxcbiAgJ3ByZWZlci1kZWZhdWx0LWV4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvcHJlZmVyLWRlZmF1bHQtZXhwb3J0JyksXG5cbiAgLy8gbWV0YWRhdGEtYmFzZWRcbiAgJ25vLWRlcHJlY2F0ZWQnOiByZXF1aXJlKCcuL3J1bGVzL25vLWRlcHJlY2F0ZWQnKSxcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZ3MgPSB7XG4gICdlcnJvcnMnOiByZXF1aXJlKCcuLi9jb25maWcvZXJyb3JzJyksXG4gICd3YXJuaW5ncyc6IHJlcXVpcmUoJy4uL2NvbmZpZy93YXJuaW5ncycpLFxuXG4gIC8vIHVzZWZ1bCBzdHVmZiBmb3IgZm9sa3MgdXNpbmcgUmVhY3RcbiAgJ3JlYWN0JzogcmVxdWlyZSgnLi4vY29uZmlnL3JlYWN0JyksXG5cbiAgLy8gc2hoaGguLi4gd29yayBpbiBwcm9ncmVzcyBcInNlY3JldFwiIHJ1bGVzXG4gICdzdGFnZS0wJzogcmVxdWlyZSgnLi4vY29uZmlnL3N0YWdlLTAnKSxcbn1cbiJdfQ==