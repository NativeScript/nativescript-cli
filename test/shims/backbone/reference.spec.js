/**
 * Copyright 2013 Kinvey, Inc.
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

// Obtain a reference to the top-level describe method.
var globalDescribe = describe;

/**
 * Test suite for using references with `Kinvey.Backbone`.
 */
describe('Kinvey.Backbone with references', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: spy on save.
  before(function() {
    sinon.spy(Kinvey.DataStore, 'save');
  });
  beforeEach(function() {// Reset.
    Kinvey.DataStore.save.reset();
  });
  after(function() {// Restore.
    Kinvey.DataStore.save.restore();
  });

  // Kinvey.Backbone.Model.
  describe('Kinvey.Backbone.Model', function() {
    // Housekeeping: define a relationship.
    before(function() {
      this.Relation = Kinvey.Backbone.Model.extend({
        relations: [{
          type         : Backbone.One,
          key          : 'field',
          relatedModel : Kinvey.Backbone.Model,
          collection   : this.collection
        }],
        url: this.collection
      });
      this.Model = Kinvey.Backbone.Model.extend({
        relations: [{
          type         : Backbone.One,
          key          : 'field',
          relatedModel : this.Relation
        }, {
          type           : Backbone.Many,
          key            : 'field2',
          relatedModel   : Kinvey.Backbone.Model,
          collection     : this.collection,
          collectionType : Kinvey.Backbone.Collection
        }],
        url: this.collection
      });
    });
    afterEach(function() {// Reset the exclude flags.
      this.Model.prototype.relations.forEach(function(relation) {
        delete relation.autoFetch;
        delete relation.autoSave;
      });
    });
    after(function() {// Cleanup.
      delete this.Model;
      delete this.Relation;
    });

    // Housekeeping: create an empty model.
    beforeEach(function() {
      this.model = new this.Model();
    });
    afterEach(function() {// Cleanup.
      delete this.model;
    });

    // Kinvey.Backbone.Model.fetch.
    describe('the fetch method', function() {
      // Housekeeping: create a document.
      before(function() {
        var model = new this.Model({
          field  : { field: { attr: this.randomID() } },
          field2 : [{ attr: this.randomID() }, { attr: this.randomID() } ]
        });
        var _this = this;
        return this.jQueryToKinveyPromise(model.save()).then(function(doc) {
          _this.doc = doc[0];
        });
      });
      after(function() {// Delete the created documents.
        return Kinvey.DataStore.clean(this.collection);
      });

      // Housekeeping: initiate the model.
      beforeEach(function() {
        this.model.set('_id', this.doc._id);
      });

      // Test suite.
      it('should resolve a reference.', function() {
        var _this   = this;
        var promise = this.model.fetch();
        return this.jQueryToKinveyPromise(promise).then(function(response) {
          expect(response[0]).to.deep.equal(_this.doc);

          // Inspect the model.
          expect(_this.model).to.be.an.instanceOf(Kinvey.Backbone.Model);

          var field = _this.model.get('field');
          expect(field).to.be.an.instanceOf(_this.Relation);
          expect(field.get('field')).to.be.an.instanceOf(Kinvey.Backbone.Model);

          var collection = _this.model.get('field2');
          expect(collection).to.be.an.instanceOf(Kinvey.Backbone.Collection);
          expect(collection.models).to.have.length(2);
          collection.models.forEach(function(model) {
            expect(model).to.be.an.instanceOf(Kinvey.Backbone.Model);
          });
        });
      });
      it('should not resolve a reference if excluded.', function() {
        this.model.relations[1].autoFetch = false;// Alter the models’ relations.

        var _this   = this;
        var promise = this.model.fetch();
        return this.jQueryToKinveyPromise(promise).then(function(response) {
          expect(response[0]).not.to.have.deep.property('field2.attr');

          // Inspect the model.
          var model = _this.model.get('field2').at(0);
          expect(model.attributes).to.have.keys(['_type', '_collection', '_id']);
        });
      });
      it('should not resolve a child reference if the parent was excluded.', function() {
        this.model.relations[0].autoFetch = false;// Alter the models’ relations.

        var _this   = this;
        var promise = this.model.fetch();
        return this.jQueryToKinveyPromise(promise).then(function(response) {
          expect(response[0]).not.to.have.deep.property('field.attr');

          // Inspect the model.
          var model = _this.model.get('field');
          expect(model.attributes).to.have.keys(['_type', '_collection', '_id']);
          expect(model.get('field')).not.to.exist;
        });
      });
    });

    // Kinvey.Backbone.Model.save.
    describe('the save method', function() {
      // Housekeeping: delete any created documents.
      afterEach(function() {
        return Kinvey.DataStore.clean(this.collection);
      });

      // Housekeeping: populate the model.
      beforeEach(function() {
        this.model.set({
          field  : { field: { attr: this.randomID() } },
          field2 : [ { attr: this.randomID() }, { attr: this.randomID() } ]
        });
      });

      // Test suite.
      it('should save a reference.', function() {
        var _this   = this;
        var promise = this.model.save();
        return this.jQueryToKinveyPromise(promise).then(function(response) {
          expect(response[0]).to.have.deep.property('field.field.attr');
          expect(response[0]).to.have.deep.property('field2.[0].attr');
          expect(response[0]).to.have.deep.property('field2.[1].attr');

          // The delegation save, four relations, parent document save.
          expect(Kinvey.DataStore.save.callCount).to.equal(6);

          // Inspect the model.
          expect(_this.model).to.be.an.instanceOf(Kinvey.Backbone.Model);

          var field = _this.model.get('field');
          expect(field).to.be.an.instanceOf(_this.Relation);
          expect(field.get('field')).to.be.an.instanceOf(Kinvey.Backbone.Model);

          var collection = _this.model.get('field2');
          expect(collection).to.be.an.instanceOf(Kinvey.Backbone.Collection);
          expect(collection.models).to.have.length(2);
          collection.models.forEach(function(model) {
            expect(model).to.be.an.instanceOf(Kinvey.Backbone.Model);
          });
        });
      });
      it('should not save a reference if excluded.', function() {
        this.model.relations[1].autoSave = false;// Alter the models’ relations.

        var _this   = this;
        var promise = this.model.save();
        return this.jQueryToKinveyPromise(promise).then(function() {
          // The delegation save, two relations, parent save.
          expect(Kinvey.DataStore.save.callCount).to.equal(4);

          // Inspect the model.
          var collection = _this.model.get('field2');
          expect(collection.models).to.have.length(2);
          collection.models.forEach(function(model) {
            expect(model.id).not.to.exist;
          });
        });
      });
      it('should not save a child reference if the parent was excluded.', function() {
        this.model.relations[0].autoSave = false;// Alter the models’ relations.

        var _this   = this;
        var promise = this.model.save();
        return this.jQueryToKinveyPromise(promise).then(function() {
          // The delegation save, two relations, parent save.
          expect(Kinvey.DataStore.save.callCount).to.equal(4);

          // Inspect the model.
          var model = _this.model.get('field');
          expect(model.id).not.to.exist;
          expect(model.get('field').id).not.to.exist;
        });
      });
    });

  });

  // Kinvey.Backbone.Collection.
  describe('Kinvey.Backbone.Collection', function() {

    // Housekeeping: define a relation.
    before(function() {
      this.Model = Kinvey.Backbone.Model.extend({
        relations: [{
          type         : Backbone.One,
          key          : 'field',
          relatedModel : Kinvey.Backbone.Model,
          collection   : this.collection
        }],
        url: this.collection
      });
      this.Collection = Kinvey.Backbone.Collection.extend({
        model : this.Model,
        url   : this.collection
      });
    });
    after(function() {// Cleanup.
      delete this.Collection;
      delete this.Model;
    });

    // Housekeeping: create an empty collection.
    beforeEach(function() {
      this.col = new this.Collection();
    });
    afterEach(function() {// Cleanup.
      delete this.col;
    });

    // Kinvey.Backbone.Collection.fetch.
    describe('the fetch method', function() {
      // Housekeeping: create a document.
      before(function() {
        var model = new this.Model({ field: { attr: this.randomID() } });
        var _this = this;
        return this.jQueryToKinveyPromise(model.save()).then(function(doc) {
          _this.doc = doc[0];
        });
      });
      after(function() {// Delete the documents.
        return Kinvey.DataStore.clean(this.collection);
      });
      after(function() {// Cleanup.
        delete this.doc;
      });

      // Housekeeping: filter the documents.
      beforeEach(function() {
        this.col.query = new Kinvey.Query().contains('_id', [ this.doc._id ]);
      });

      // Test suite.
      it('should adhere to its models’ relations.', function() {
        var _this   = this;
        var promise = this.col.fetch();
        return this.jQueryToKinveyPromise(promise).then(function(response) {
          expect(response[0]).to.have.length(1);
          expect(response[0][0]).to.deep.equal(_this.doc);

          // Inspect the collection.
          expect(_this.col.models).to.have.length(1);
          var model = _this.col.at(0);

          expect(model).to.be.an.instanceOf(_this.Model);
          expect(model.get('field')).to.be.an.instanceOf(Kinvey.Backbone.Model);
        });
      });
    });

    // Kinvey.Backbone.Collection.create.
    describe('the create method', function() {
      // Housekeeping: delete any created documents.
      afterEach(function() {
        return Kinvey.DataStore.clean(this.collection);
      });

      // Housekeeping: populate the model.
      beforeEach(function() {
        this.model = { field: { attr: this.randomID() } };
      });
      afterEach(function() {// Cleanup.
        delete this.model;
      });

      // Test suite.
      it('should adhere to its models’ relations.', function() {
        var deferred = Kinvey.Defer.deferred();
        var _this = this;
        var model = this.col.create(this.model);
        model.on('sync', function() {
          try {
            // The delegate save, one relation, parent save.
            expect(Kinvey.DataStore.save.callCount).to.equal(3);

            // Inspect the model.
            expect(model).to.be.an.instanceOf(_this.Model);
            expect(model.get('field')).to.be.an.instanceOf(Kinvey.Backbone.Model);

            return deferred.resolve(arguments);
          }
          catch(e) {
            return deferred.reject(e);
          }
        });

        // Return the promise.
        return expect(deferred.promise).to.be.fulfilled;
      });
    });

  });
});