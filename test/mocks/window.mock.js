module.exports = exports = (function() {
  'use strict';

  var window = {
    open: function() {
      return window;
    },

    location: {
      search: undefined,
      href: undefined
    }
  };

  return window;
})();
