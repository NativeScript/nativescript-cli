// Utils.
// ------

// Define the Sync mixin.
/**
 * @private
 * @namespace SyncMixin
 */
var SyncMixin = /** @lends SyncMixin */{
  /**
   * Invokes the persistence layer.
   * See [Backbone.js](http://backbonejs.org/#Sync).
   *
   * @member
   * @default
   * @type {Kinvey.Backbone.Sync}
   */
  sync: function() {
    return Kinvey.Backbone.Sync.apply(this, arguments);
  }
};

// Helper function to wrap the optional callbacks with a default success and
// error callback.
var backboneWrapCallbacks = function(model, options, mutate) {
  // Cast arguments.
  mutate = 'undefined' === typeof mutate ? true : mutate;

  // Extend the success callback.
  var success = options.success;
  options.success = function(response) {
    // If `mutate`, update the model.
    if(mutate) {
      if(model instanceof Backbone.Model) {
        if(!model.set(model.parse(response, options), options)) {
          return false;
        }
      }
      else {// Update the collection.
        var method = options.reset ? 'reset' : 'set';
        if(!model[method]) {// Backbone < 1.0.0 does not have the set method.
          // If 0.9.9 & 0.9.10, use update. Otherwise, use reset.
          method = isFunction(model.update) ? 'update' : 'reset';
        }
        model[method](response, options);
      }
    }

    // Invoke the application-level success handler.
    if(success) {
      success(model, response, options);
    }

    // Trigger the `sync` event.
    if(mutate) {
      model.trigger('sync', model, response, options);
    }
  };

  // Extend the error callback.
  var error = options.error;
  options.error = function(response) {
    // Invoke the application-level error handler.
    if(error) {
      error(model, response, options);
    }

    // Trigger the `error` event.
    if(mutate) {
      model.trigger('error', model, response, options);
    }
  };
};