// jQuery “promises” are not really promises as they don’t implement the
// [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/). In
// short; jQuery promises are currently (v2.0) completely broken in regard to
// the error handling semantics. For more information, visit one of the links
// below. This adapter merely serves as a security measure so that developers
// don’t attempt to use jQuery promises as internal defer mechanism.

// http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/
// http://bugs.jquery.com/ticket/11010

// Always throw an error when attempting to use jQuery promises.
if('undefined' !== typeof jQuery.Deferred) {
  Kinvey.Defer.use({
    /**
     * @augments {Kinvey.Defer.deferred}
     * @throws {Kinvey.Error} `Kinvey.Defer` is incompatible with jQuery’s
     *           so-called “promises”.
     */
    deferred: function() {
      throw new Kinvey.Error('Kinvey.Defer is incompatible with jQuery’s so-called “promises”.');
    }
  });
}