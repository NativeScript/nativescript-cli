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

/**
 * The `KinveyReference` test suite.
 */
describe('Kinvey.References', function() {

  // If there is no adapter, skip the test suite.
  var hasLocalAdapter = (function() {
    try {
      Kinvey.Persistence.Local.read({ id: '_count' });
      return true;
    }
    catch(e) {
      return false;
    }
  }());

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Define the test suite in a way that all persistence layers can be tested.
  var suite = function(test, options) {
    // Test suite.
    describe(test, function() {
      // Housekeeping: enable local persistence.
      if(null != options && options.offline) {
        before(function() {
          return Kinvey.Sync.init({ enable: true });
        });
        after(function() {// Reset.
          return Kinvey.Sync.init({ enable: false });
        });
        after(function() {
          return Kinvey.Sync.execute();
        });
      }

      // Housekeeping: reset options.
      beforeEach(function() {// Provide a fresh copy of the options.
        this.options = options ? JSON.parse(JSON.stringify(options)) : {};
      });
      afterEach(function() {// Cleanup.
        delete this.options;
      });

      // Housekeeping: delete any created documents.
      after(function() {
        return Kinvey.DataStore.clean(this.collection, null, options);
      });

      // Housekeeping: create a relational document.
      before(function() {
        var _this = this;
        return Kinvey.DataStore.save(this.collection, {
          field: this.randomID()
        }, options).then(function(doc) {
          _this.doc3 = doc;
        });
      });
      before(function() {
        var _this = this;
        return Kinvey.DataStore.save(this.collection, {
          field: this.randomID(),
          relation: { _type: 'KinveyRef', _collection: this.collection, _id: this.doc3._id }
        }, options).then(function(doc) {
          _this.doc = doc;
        });
      });
      before(function() {
        var _this = this;
        return Kinvey.DataStore.save(this.collection, {
          field     : this.randomID(),
          relation  : { _type: 'KinveyRef', _collection: this.collection, _id: this.doc._id },
          relations  : [{ _type: 'KinveyRef', _collection: this.collection, _id: this.doc._id }],
          relation2 : [{ _type: 'KinveyRef', _collection: this.collection, _id: this.randomID() }]
        }, options).then(function(doc) {
          _this.doc2 = doc;
        });
      });
      after(function() {// Cleanup.
        delete this.doc;
        delete this.doc2;
        delete this.doc3;
      });

      // Kinvey.DataStore.find.
      describe('the Kinvey.DataStore.find method', function() {
        // Housekeeping: define the query.
        before(function() {
          this.query = new Kinvey.Query().equalTo('_id', this.doc2._id);
        });
        after(function() {// Cleanup.
          delete this.query;
        });

        // Test suite.
        it('should not resolve a reference.', function() {
          var promise = Kinvey.DataStore.find(this.collection, this.query, this.options);
          return expect(promise).to.become([ this.doc2 ]);
        });
        it('should resolve a reference if `options.relations`.', function() {
          this.options.relations = { relation: this.collection };

          var _this   = this;
          var promise = Kinvey.DataStore.find(this.collection, this.query, this.options);
          return promise.then(function(response) {
            expect(response).to.have.length(1);
            expect(response[0]).to.have.property('relation');
            expect(response[0].relation).to.deep.equal(_this.doc);
          });
        });
        it('should retain the reference when it cannot be resolved.', function() {
          this.options.relations = { relation2: this.collection };

          var promise = Kinvey.DataStore.find(this.collection, this.query, this.options);
          return expect(promise).to.become([ this.doc2 ]);
        });
      });

      // Kinvey.DataStore.get.
      describe('the Kinvey.DataStore.get method', function() {
        // Test suite.
        it('should not resolve a reference.', function() {
          var promise = Kinvey.DataStore.get(this.collection, this.doc2._id, this.options);
          return expect(promise).to.become(this.doc2);
        });
        it('should resolve a reference if `options.relations`.', function() {
          this.options.relations = { relation: this.collection };

          var _this   = this;
          var promise = Kinvey.DataStore.get(this.collection, this.doc2._id, this.options);
          return promise.then(function(response) {
            expect(response).to.have.property('relation');
            expect(response.relation.field).to.equal(_this.doc.field);
          });
        });
        it('should resolve a reference of a reference inside an array if `options.relations`.', function() {
          this.options.relations = { relations: this.collection, 'relations.relation': this.collection };

          var _this   = this;
          var promise = Kinvey.DataStore.get(this.collection, this.doc2._id, this.options);
          return promise.then(function(response) {
            expect(response).to.have.property('relation');
            expect(response.relations[0].field).to.equal(_this.doc.field);
            expect(response.relations[0].relation.field).to.equal(_this.doc3.field);
          });
        });
        it('should retain the reference when it cannot be resolved.', function() {
          this.options.relations = { relation2: this.collection };

          var promise = Kinvey.DataStore.get(this.collection, this.doc2._id, this.options);
          return expect(promise).to.become(this.doc2);
        });
      });

      // Kinvey.DataStore.save.
      describe('the Kinvey.DataStore.save method', function() {
        // Housekeeping: define the document.
        beforeEach(function() {
          this.doc = { relation: { field: this.randomID() } };
        });
        afterEach(function() {// Cleanup.
          delete this.document;
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

        // Test suite.
        it('should save the document as is.', function() {
          var _this   = this;
          var promise = Kinvey.DataStore.save(this.collection, this.doc, this.options);
          return promise.then(function(response) {
            // Expect one call to save: save document.
            expect(Kinvey.DataStore.save).to.be.calledOnce;
            expect(response).to.have.deep.property('relation.field', _this.doc.relation.field);
          });
        });
        it('should save the document and its relation if `options.relations`.', function() {
          this.options.relations = { relation: this.collection };

          var _this   = this;
          var promise = Kinvey.DataStore.save(this.collection, this.doc, this.options);
          return promise.then(function(response) {
            // Expect three calls to save: delegation, save relation, save document.
            expect(Kinvey.DataStore.save).to.be.calledThrice;
            expect(response).to.have.deep.property('relation.field', _this.doc.relation.field);
          });
        });
        it('should save the document without its relation if `options.exclude`.', function() {
          this.options.relations = { relation: this.collection };
          this.options.exclude   = [ 'relation' ];

          var _this   = this;
          var promise = Kinvey.DataStore.save(this.collection, this.doc, this.options);
          return promise.then(function(response) {
            // Expect two calls to save: delegation, save document.
            expect(Kinvey.DataStore.save).to.be.calledTwice;
            expect(response).not.to.have.property('relation._id');
            expect(response).to.have.deep.property('relation.field', _this.doc.relation.field);
          });
        });
        it('should fail when a relation cannot be saved.', function() {
          this.options.relations = { relation: '_' };// Invalid collection name.

          var promise = Kinvey.DataStore.save(this.collection, this.doc, this.options);
          return promise.then(function() {
            // We should not reach this code branch.
            return expect(promise).to.be.rejected;
          }, function(error) {
            expect(error).to.have.property('name', Kinvey.Error.INVALID_IDENTIFIER);
          });
        });
        it('should succeed when a relation cannot be saved if `options.force`.', function() {
          this.options.relations = { relation: '_' };// Invalid collection name.
          this.options.force     = true;

          var _this   = this;
          var promise = Kinvey.DataStore.save(this.collection, this.doc, this.options);
          return promise.then(function(response) {
            // Expect three calls to save: delegation, save relation, save document.
            expect(Kinvey.DataStore.save).to.be.calledThrice;
            expect(response).to.have.deep.property('relation.field', _this.doc.relation.field);
          });
        });
      });
    });
  };

  // Run the test suite.
  suite('using net persistence');
  if(hasLocalAdapter) {
    suite('using local persistence', { offline: true, fallback: false });
  }
});