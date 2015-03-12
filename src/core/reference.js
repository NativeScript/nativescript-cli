/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Relational Data.
// ----------------

// Returns a shallow clone of the specified object.
var clone = function(object) {
  var result = { };
  for(var key in object) {
    if(object.hasOwnProperty(key)) {
      result[key] = object[key];
    }
  }
  return result;
};

/**
 * @private
 * @namespace KinveyReference
 */
var KinveyReference = /** @lends KinveyReference */{
  /**
   * Retrieves relations for a document.
   * NOTE This method should be used in conjunction with local persistence.
   *
   * @param {Array|Object} document The document, or list of documents.
   * @param {Options} options Options.
   * @returns {Promise} The document.
   */
  get: function(document, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving relations for a document.', document, options);
    }

    // If a list of documents was passed in, retrieve all relations in parallel.
    if(isArray(document)) {
      var promises = document.map(function(member) {
        return KinveyReference.get(member, clone(options));
      });
      return Kinvey.Defer.all(promises);
    }

    // Cast arguments.
    options           = options || {};
    options.exclude   = options.exclude   || [];
    options.relations = options.relations || {};

    // Temporarily reset some options to avoid infinite recursion and invoking
    // the callbacks multiple times.
    var error     = options.error;
    var relations = options.relations;
    var success   = options.success;
    delete options.error;
    delete options.relations;
    delete options.success;



    // We need to build a relationship mapping object
    // This is important because we might have to resolve
    // relationships as objects inside an array of existing
    // relationships.
    //
    // ala: 'month', 'month.days'
    // with an array of every month as the relationship key
    var relationMapping = {};
    Object.keys(relations).forEach(function(relation) {
      var mapping = relationMapping;
      var relationSplit = relation.split('.');
      var relationLength = relationSplit.length;
      relationSplit.forEach(function(relationStep, index){
        if(!mapping.keys){
          mapping.keys = {};
        }
        if(!mapping.keys[relationStep]){
          mapping.keys[relationStep] = {};
        }

        mapping = mapping.keys[relationStep];

        if(index === relationLength - 1){
          mapping.resolve = true;
        }
      });
    });


    //Recursively process relationships
    var resolveRelationships = function(entity, relationMapping){
      var error;

      if(relationMapping.keys){
        var relationshipPromises = [];

        Object.keys(relationMapping.keys).forEach(function(key){
          var relationLevel = relationMapping.keys[key];
          if(relationLevel.resolve){
            // Retrieve the relation(s) in parallel.
            var isKeyArray = isArray(entity[key]);
            var promises = (isKeyArray ? entity[key] : [entity[key]]).map(function(member) {
              // Do not retrieve if the property is not a reference, or it is
              // explicitly excluded.
              if(null == member || 'KinveyRef' !== member._type) {
                return Kinvey.Defer.resolve(member);
              }

              // Check member for property _id
              if (member._id == null) {
                error = new Kinvey.Error('Member does not have _id property defined. ' +
                                         'It is required to resolve the relationship.');
                return Kinvey.Defer.reject(error);
              }

              // Forward to the `Kinvey.User` or `Kinvey.DataStore` namespace.
              var promise;
              if(USERS === member._collection) {
                promise = Kinvey.User.get(member._id, options);
              }
              else {
                promise = Kinvey.DataStore.get(member._collection, member._id, options);
              }

              // Return the response.
              return promise.then(function(resolvedMember){
                return resolveRelationships(resolvedMember, relationLevel).then(function(){
                  return resolvedMember;
                }, function(){
                  return resolvedMember;
                });
              }, function() {
                // If the retrieval failed, retain the reference.
                return Kinvey.Defer.resolve(member);
              });
            });


            relationshipPromises.push(
              Kinvey.Defer.all(promises)
                .then(function(relationshipEntities){
                  //Once finished we need to update the original entity with our results
                  if(isKeyArray){
                    entity[key] = relationshipEntities;
                  }else{
                    entity[key] = relationshipEntities[0];
                  }
                })
            );
          }else{
            relationshipPromises.push(resolveRelationships(entity[key], relationLevel));
          }
        });

        return Kinvey.Defer.all(relationshipPromises);
      }else{
        return Kinvey.Defer.resolve();
      }
    };

    var promise = resolveRelationships(document, relationMapping);

    // All documents are retrieved.
    return promise.then(function() {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Retrieved relations for the document.', document);
      }

      // Restore the options and return the response.
      options.error = error;
      options.relations = relations;
      options.success = success;
      return document;
    }, function(reason) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to retrieve relations for the document.', document);
      }

      // Restore the options and return the error.
      options.error = error;
      options.relations = relations;
      options.success = success;
      return Kinvey.Defer.reject(reason);
    });

  },

  /**
   * Saves a document and its relations.
   *
   * @param {string} collection The collection.
   * @param {Array|Object} document The document, or list of documents.
   * @param {Options} options Options.
   * @param {boolean} [options.force] Succeed even if the relations could
   *          not be saved successfully.
   * @returns {Promise} The document.
   */
  save: function(collection, document, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Saving a document with relations.', collection, document, options);
    }

    // If a list of documents was passed in, retrieve all relations in parallel.
    if(isArray(document)) {
      var promises = document.map(function(member) {
        return KinveyReference.save(collection, member, clone(options));
      });
      return Kinvey.Defer.all(promises);
    }

    // Cast arguments.
    options           = options || {};
    options.exclude   = options.exclude   || [];
    options.relations = options.relations || {};

    // Temporarily reset some options to avoid infinite recursion and invoking
    // the callbacks multiple times.
    var error     = options.error;
    var relations = options.relations;
    var success   = options.success;
    delete options.error;
    delete options.relations;
    delete options.success;

    // Re-order the relations in order of deepness, so the partial responses
    // propagate properly. Moreover, relations with the same depth can safely
    // be saved in parallel.
    var properties = [];
    relations['']  = collection;// Add the top-level document.
    Object.keys(relations).forEach(function(relation) {
      // The top-level document must be the only document with index 0.
      var index = '' === relation ? 0 : relation.split('.').length;
      properties[index] = (properties[index] || []).concat(relation);
    });

    // Prepare the response.
    var documents = {};// Partial responses.
    var promise   = Kinvey.Defer.resolve(null);

    // Save all (relational) documents. Start with the deepest relations.
    properties.reverse().forEach(function(relationalLevel) {
      promise = promise.then(function() {
        var promises = relationalLevel.map(function(property) {
          var collection = relations[property];
          var obj        = nested(document, property);// The relational document.

          // Save the relation(s) in parallel.
          var isArrayRelation = isArray(obj);
          var promises = (isArrayRelation ? obj : [obj]).map(function(member) {
            // Do not save if the property is not a document or a reference
            // already, or it is explicitly excluded.
            if(null == member || 'KinveyRef' === member._type ||
             -1 !== options.exclude.indexOf(property)) {
              return Kinvey.Defer.resolve(member);
            }

            // To allow storing of users with references locally, use
            // `Kinvey.DataStore` if the operation does not need to notify
            // the synchronization functionality.
            var saveUsingDataStore = options.offline && false === options.track;

            // Forward to the `Kinvey.User` or `Kinvey.DataStore` namespace.
            var promise;
            if(USERS === collection && !saveUsingDataStore) {
              // If the referenced user is new, create with `state` set to false.
              var isNew = null == member._id;
              options.state = isNew && '' !== property ? options.state || false : options.state;
              promise = Kinvey.User[isNew ? 'create' : 'update'](member, options);
            }
            else {
              promise = Kinvey.DataStore.save(collection, member, options);
            }

            // Return the response.
            return promise.then(null, function(error) {
              // If `options.force`, succeed if the save failed.
              if(options.force && '' !== property) {
                return member;
              }
              return Kinvey.Defer.reject(error);
            });
          });

          // Return the response.
          return Kinvey.Defer.all(promises).then(function(responses) {
            // Replace the relations in the original document with references.
            var reference = responses.map(function(response) {
              // Do not convert non-relations to references.
              if(null == response || null == response._id) {
                return response;
              }
              return { _type: 'KinveyRef', _collection: collection, _id: response._id };
            });

            // Update the original document and add the partial response.
            if(!isArrayRelation) {
              reference = reference[0];
              responses = responses[0];
            }
            nested(document, property, reference);
            documents[property] = responses;
          });
        });
        return Kinvey.Defer.all(promises);
      });
    });

    // All documents are saved. Replace the references in the document with the
    // actual relational document, starting with the top-level document.
    return promise.then(function() {
      var response = documents[''];// The top-level document.
      properties.reverse().forEach(function(relationalLevel) {
        relationalLevel.forEach(function(property) {
          nested(response, property, documents[property]);
        });
      });

      // Debug.
      if(KINVEY_DEBUG) {
        log('Saved the document with relations.', response);
      }

      // Restore the options and return the response.
      delete relations[''];// Remove the added top-level document.
      options.error     = error;
      options.relations = relations;
      options.success   = success;
      return response;
    }, function(reason) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to save the document with relations.', error);
      }

      // Restore the options and return the error.
      delete relations[''];// Remove the added top-level document.
      options.error     = error;
      options.relations = relations;
      options.success   = success;
      return Kinvey.Defer.reject(reason);
    });
  }
};
