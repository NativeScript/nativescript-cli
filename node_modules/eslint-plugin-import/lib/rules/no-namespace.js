'use strict';

/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
  return {
    'ImportNamespaceSpecifier': function ImportNamespaceSpecifier(node) {
      context.report(node, 'Unexpected namespace import.');
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW5hbWVzcGFjZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sT0FBUCxHQUFpQixVQUFVLE9BQVYsRUFBbUI7QUFDbEMsU0FBTztBQUNMLGdDQUE0QixrQ0FBVSxJQUFWLEVBQWdCO0FBQzFDLGNBQVEsTUFBUixDQUFlLElBQWYsa0NBRDBDO0tBQWhCO0dBRDlCLENBRGtDO0NBQW5CIiwiZmlsZSI6InJ1bGVzL25vLW5hbWVzcGFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIGRpc2FsbG93IG5hbWVzcGFjZSBpbXBvcnRcbiAqIEBhdXRob3IgUmFkZWsgQmVua2VsXG4gKi9cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gIHJldHVybiB7XG4gICAgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICBjb250ZXh0LnJlcG9ydChub2RlLCBgVW5leHBlY3RlZCBuYW1lc3BhY2UgaW1wb3J0LmApXG4gICAgfSxcbiAgfVxufVxuIl19