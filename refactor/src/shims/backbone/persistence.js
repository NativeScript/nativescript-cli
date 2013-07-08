// Persistence.
// ------------

// The `Kinvey.Backbone.Sync` method translates a Backbone CRUD method to
// either a `Kinvey.DataStore` or `Kinvey.User` method.

/**
 * Returns an object containing all (nested) relations of the specified model.
 *
 * @param {string} mode The mode, read or write.
 * @param {Backbone.Model} model The model.
 * @throws {Kinvey.Error} collection or relatedModel must be set on the
 *           relation.
 * @returns {Object} The relations to in- and exclude.
 */
var backboneRelations = function(mode, model) {
  // Prepare the response.
  var exclude   = [];
  var relations = {};

  // The exclude property to check.
  var prop = 'read' === mode ? 'autoFetch' : 'autoSave';

  // Helper function to add relations to the stack.
  var stack      = [];
  var addToStack = function(relations, depth, prefix) {
    relations.forEach(function(relation) {
      stack.push({ relation: relation, depth: depth || 0, prefix: prefix || null });
    });
  };
  addToStack(model.relations || []);

  // Traverse the stack and add the relations to the response.
  var item;
  while(null != (item = stack.shift())) {
    var depth    = item.depth;
    var prefix   = item.prefix;
    var relation = item.relation;

    // Include relations up to 10 levels deep.
    if(10 === depth) {
      continue;
    }

    // Obtain the relations’ prototype (if any).
    var relatedModel = null;
    if(relation.relatedModel) {
      // `relatedModel` is either a string resolving to a global scope object,
      // or a reference to a `Backbone.AssociatedModel` class.
      relatedModel = (root[relation.relatedModel] || relation.relatedModel).prototype;
    }

    // Obtain, validate, and cast the collection.
    var collection = relation.collection || _.result(relatedModel, 'url');
    if(null == collection) {
      throw new Kinvey.Error('collection or relatedModel must be set on the relation.');
    }
    if(0 === collection.indexOf('/')) {// Strip the leading slash (if any).
      collection = collection.substr(1);
    }

    // Add the relation.
    var key = null !== prefix ? prefix + '.' + relation.key : relation.key;
    relations[key] = collection;
    if(false === relation[prop]) {
      exclude.push(key);
    }

    // Add any nested relations to the stack.
    if(false !== relation[prop] && null != relatedModel && !isEmpty(relatedModel.relations)) {
      addToStack(relatedModel.relations, depth + 1, key);
    }
  }

  // Return the response.
  return { exclude: exclude, relations: relations };
};

/**
 * Translates and invokes a Kinvey method from a Backbone CRUD method.
 *
 * @param {string} method The CRUD method.
 * @param {string} collection The collection.
 * @param {?string} id The document id (if any).
 * @param {?Object} document The document (if any).
 * @param {Object} options Options.
 * @throws {Kinvey.Error} `id` must not be null.
 * @returns {Promise} The response.
 */
var backboneToKinveyCRUD = function(method, collection, id, data, options) {
  // Cast arguments. An explicit `id` should override `data._id`.
  if(null != id && isObject(data)) {
    data._id = id;
  }

  // Use a query if `id` and `data` is not a document.
  var query = null == id && (!isObject(data) || isArray(data));

  // Translate Backbone methods to Kinvey methods.
  var namespace = USERS === collection ? Kinvey.User : Kinvey.DataStore;
  var methodMap = {
    create   : namespace[USERS === collection ? 'create' : 'save'],
    read     : query ? namespace.find : namespace.get,
    update   : namespace.update,
    'delete' : query ? namespace.clean : namespace.destroy
  };

  // Build arguments. Both `Kinvey.DataStore` and `Kinvey.User` expect the
  // document id or data, together with `options`. `Kinvey.DataStore`, however,
  // requires an initial collection argument.
  var args = [
    query ? options.query : ('read' === method || 'delete' === method ? id : data),
    options
  ];
  if(USERS !== collection) {
    args.unshift(collection);
  }

  // Invoke the Kinvey method.
  return methodMap[method].apply(namespace, args);
};

/**
 * Persist a Backbone model to the Kinvey backend.
 *
 * @memberof! <global>
 * @function Kinvey.Backbone.Sync
 * @param {string} method The CRUD method.
 * @param {Object} model The model to be saved, or the collection to be read.
 * @param {Object} options Callbacks, and request options.
 * @throws {Kinvey.Error} `model` or `options` must contain: url.
 * @returns {Promise} The response.
 */
Kinvey.Backbone.Sync = function(method, model, options) {
  // Cast and validate arguments.
  options.query   = options.query || model.query;// Attach a (optional) query.
  options.subject = model;// Used by the persistence layer.

  // Extend the success handler to translate `silentFail` to silent when
  // executing inside the Kinvey core.
  var silent  = options.silent;
  var success = options.success;
  options.silent  = options.silentFail || false;
  options.success = function(response) {
    options.silent = silent;// Reset.

    // Invoke the application-level success handler.
    if(success) {
      success(response);
    }
  };

  // Obtain the url and document data.
  var data = options.attrs || model.toJSON(options);
  var url  = options.url   || _.result(model, 'url');
  if(null == url) {
    throw new Kinvey.Error('model or options argument must contain: url.');
  }

  // Strip the leading slash (if any).
  if(0 === url.indexOf('/')) {
    url = url.substr(1);
  }

  // Extract the collection and document id from the url.
  var segments   = url.split('/');
  var collection = segments[0];
  var id         = segments[1] || data._id || null;

  // Add support for references for both collections and models.
  var relations = model.model ? model.model.prototype.relations : model.relations;
  if(!isEmpty(relations)) {
    var mode  = 'read' === method ? 'read' : 'write';
    relations = backboneRelations(mode, this.model ? this.model.prototype : this);
    options.exclude   = relations.exclude;
    options.relations = relations.relations;
  }

  // Translate to `Kinvey` core function call and return the response.
  var promise = backboneToKinveyCRUD(method, collection, id, data, options);
  return kinveyToBackbonePromise(promise, options);
};