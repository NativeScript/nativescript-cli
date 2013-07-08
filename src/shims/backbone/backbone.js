/* global _: true */

// Backbone.
// ---------

// All Backbone shim functionality will be appended to `Kinvey.Backbone`.

/**
 * @memberof! <global>
 * @namespace Kinvey.Backbone
 */
Kinvey.Backbone = /** @lends Kinvey.Backbone */{
  /**
   * Returns the active user as `Kinvey.Backbone.User` instance.
   *
   * @returns {?Kinvey.Backbone.User} The user model, or `null` if there is no
   *            active user.
   */
  getActiveUser: function() {
    var user = Kinvey.getActiveUser();
    return null !== user ? new Kinvey.Backbone.User(user) : null;
  }
};