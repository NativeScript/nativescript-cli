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
 * Test suite for `Kinvey.Persistence.Local`.
 */
describe('Kinvey.Persistence.Local', function() {

  // If there is no adapter, skip the test suite.
  var describe = (function() {
    try {
      Kinvey.Persistence.Local.read({ id: '_count' });
      return globalDescribe;
    }
    catch(e) {
      return globalDescribe.skip;
    }
  }());

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {
    Kinvey.setActiveUser(null);
  });

  // Kinvey.Persistence.Local.create.
  describe('the create method', function() {
    // Housekeeping: delete the created documents (if any).
    afterEach(function() {
      return Kinvey.Persistence.Local.destroy({ collection: this.collection });
    });

    // Test suite.
    it('should fail on invalid collection name.', function() {
      var promise = Kinvey.Persistence.Local.create({
        collection : true,
        data       : { field: this.randomID() }
      });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', 'InvalidIdentifier');
      });
    });
    it('should batch create a list of documents.', function() {
      var documents = [
        { field: this.randomID() },
        { _id: this.randomID(), field: this.randomID() }
      ];
      var promise = Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : documents
      }).then(function(response) {
        expect(response).to.be.an('array');
        expect(response).to.have.length(2);

        // Inspect array.
        response.forEach(function(document) {
          expect(document).to.have.property('_id');
          expect(document).to.have.property('field');
        });
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should create a new document.', function() {
      var document = { field: this.randomID() };
      var promise = Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : document
      }).then(function(response) {
        expect(response).to.have.property('_id');
        expect(response._id).to.match(/^[a-f0-9]{24}$/);// 24-char hex.
        expect(response).to.have.property('field', document.field);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should update an existing document.', function() {
      var document = { _id: this.randomID(), foo: this.randomID() };
      var promise = Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : document
      });
      return expect(promise).to.become(document);
    });
  });

  // Kinvey.Persistence.Local.read.
  describe('the read method', function() {
    // Housekeeping: create two documents.
    before(function() {
      var _this = this;
      return Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : [ { field: 1 }, { field: 2 } ]
      }).then(function(response) {
        _this.doc1 = response[0];
        _this.doc2 = response[1];
      });
    });
    after(function() {// Delete the documents.
      return Kinvey.Persistence.Local.destroy({ collection: this.collection });
    });
    after(function() {// Cleanup.
      delete this.doc1;
      delete this.doc2;
    });

    // _me.
    describe('when using _me', function() {
      // Housekeeping: save the active user locally.
      before(function() {
        return Kinvey.Persistence.Local.create({
          namespace : 'user',
          data       : Kinvey.getActiveUser()
        });
      });
      after(function() {
        return Kinvey.Persistence.Local.destroy({
          namespace : 'user',
          _id       : Kinvey.getActiveUser()._id
        });
      });
      afterEach(function() {// Restore.
        Kinvey.setActiveUser(this.user);
      });

      // Test suite.
      it('should return the active user.', function() {
        var _this   = this;
        var promise = Kinvey.Persistence.Local.read({
          namespace  : 'user',
          collection : '_me'
        });
        return promise.then(function(user) {
          expect(user._id).to.equal(_this.user._id);
          expect(user._kmd.authtoken).to.equal(_this.user._kmd.authtoken);
          expect(user.username).to.equal(_this.user.username);
        });
      });
      it('should return the input if the user is not available locally.', function() {
        var mock = { _id: this.randomID(), _kmd: { authtoken: this.randomID() } };
        Kinvey.setActiveUser(mock);

        var promise = Kinvey.Persistence.Local.read({
          namespace  : 'user',
          collection : '_me'
        });
        return promise.then(function(user) {
          expect(user).to.have.keys(['_id', '_kmd']);
          expect(user._id).to.equal(mock._id);
          expect(user._kmd.authtoken).to.equal(mock._kmd.authtoken);
        });
      });
      it('should fail when there is no active user.', function() {
        Kinvey.setActiveUser(null);
        var promise = Kinvey.Persistence.Local.read({
          namespace  : 'user',
          collection : '_me'
        });
        return expect(promise).to.be.rejected;
      });
    });

    // Fetches.
    describe('when fetching', function() {
      // Test suite.
      it('should fail on invalid collection name.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : true,
          id         : this.doc1._id
        });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function(error) {
          expect(error).to.have.property('name', 'InvalidIdentifier');
        });
      });
      it('should return a document.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : this.doc1._id
        });
        return expect(promise).to.become(this.doc1);
      });
      it('should fail when the document does not exist.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : this.randomID()
        });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function(error) {
          expect(error).to.have.property('name', Kinvey.Error.ENTITY_DOES_NOT_EXIST);
        });
      });
      it('should return all documents.', function() {
        var _this = this;
        var promise = Kinvey.Persistence.Local.read({ collection: this.collection }).then(function(response) {
          expect(response).to.be.an('array');
          expect(response).to.have.length(2);

          // Inspect array.
          var idList = response.map(function(document) {
            return document._id;
          });
          expect(idList).to.contain(_this.doc1._id);
          expect(idList).to.contain(_this.doc2._id);
        });
        return expect(promise).to.be.fulfilled;
      });
      it('should return all documents, with filter:attribute.', function() {
        var query   = new Kinvey.Query().equalTo('field', this.doc1.field);
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          query      : query
        });
        return expect(promise).to.become([ this.doc1 ]);
      });
      it('should return all documents, with filter:nonExistingAttribute.', function() {
        var query   = new Kinvey.Query().exists(this.randomID());
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          query      : query
        });
        return expect(promise).to.become([]);
      });
      it('should return all documents, with sort:attribute.', function() {
        var query   = new Kinvey.Query().ascending('field');
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          query      : query
        }).then(function(response) {
          expect(response).to.be.an('array');
          expect(response).to.have.length(2);

          // Inspect array.
          for(var i = 1, j = response.length; i < j; i += 1) {
            expect(response[i - 1].field).to.be.lessThan(response[i].field);
          }
        });
        return expect(promise).to.be.fulfilled;
      });
      it('should return all documents, with limit.', function() {
        var query   = new Kinvey.Query().limit(1);
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          query      : query
        });
        return expect(promise).to.eventually.have.length(1);
      });
      it('should return all documents, with skip.', function() {
        var query   = new Kinvey.Query().skip(1);
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          query      : query
        });
        return expect(promise).to.eventually.have.length(1);
      });
    });

    // Counts.
    describe('when counting', function() {
      // Housekeeping: create empty query.
      beforeEach(function() {
        this.query = new Kinvey.Query();
      });
      afterEach(function() {// Cleanup.
        delete this.query;
      });

      // Test suite.
      it('should fail on invalid collection name.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : true,
          id         : '_count'
        });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function(error) {
          expect(error).to.have.property('name', 'InvalidIdentifier');
        });
      });
      it('should count the number of documents.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count'
        });
        return expect(promise).to.eventually.have.property('count', 2);
      });
      it('should count the number of documents, with filter:attribute.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count',
          query      : this.query.equalTo('field', this.doc1.field)
        });
        return expect(promise).to.eventually.have.property('count', 1);
      });
      it('should count the number of documents, with filter:nonExistingAttribute.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count',
          query      : this.query.exists(this.randomID())
        });
        return expect(promise).to.eventually.have.property('count', 0);
      });
      it('should count the number of documents, regardless of sort.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count',
          query      : this.query.ascending('field')
        });
        return expect(promise).to.eventually.have.property('count', 2);
      });
      it('should count the number of documents, regardless of limit.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count',
          query      : this.query.limit(1)
        });
        return expect(promise).to.eventually.have.property('count', 2);
      });
      it('should count the number of documents, regardless of skip.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : this.collection,
          id         : '_count',
          query      : this.query.skip(10)
        });
        return expect(promise).to.eventually.have.property('count', 2);
      });
    });

    // Aggregations.
    describe('when aggregating', function() {
      // Housekeeping: create empty aggregation.
      beforeEach(function() {
        this.agg = new Kinvey.Group();
      });
      afterEach(function() {// Cleanup.
        delete this.agg;
      });

      // Test suite.
      it('should fail on invalid collection name.', function() {
        var promise = Kinvey.Persistence.Local.read({
          collection : true,
          id         : '_group',
          data       : this.agg.toJSON()
        });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function(error) {
          expect(error).to.have.property('name', 'InvalidIdentifier');
        });
      });
      it('should accept an empty aggregation.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : this.agg.toJSON()
        });
        return expect(promise).to.become([ {} ]);
      });
      it('should group by.', function() {
        var _this = this;
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : this.agg.by('field').toJSON()
        }).then(function(response) {
          expect(response).to.be.an('array');
          expect(response).to.have.length(2);

          // Inspect body.
          var first = response[0].field === _this.doc1.field;
          if(first) {
            expect(response[0].field).to.equal(_this.doc1.field);
            expect(response[1].field).to.equal(_this.doc2.field);
          }
          else {
            expect(response[0].field).to.equal(_this.doc2.field);
            expect(response[1].field).to.equal(_this.doc1.field);
          }
        });
        return expect(promise).to.be.fulfilled;
      });
      it('should group with query.', function() {
        var query = new Kinvey.Query().equalTo('field', this.doc1.field);
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : this.agg.by('field').query(query).toJSON()
        });
        return expect(promise).to.become([ { field: 1 } ]);
      });
      it('should group with initial.', function() {
        var initial = { field : 0 };
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : this.agg.initial(initial).toJSON()
        });
        return expect(promise).to.become([ { field: 0 } ]);
      });
      it('should group with reduce.', function() {
        this.agg.initial('result', 0);
        this.agg.reduce(function(doc, out) {
          out.result = 1;
        });

        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : this.agg.toJSON()
        });
        return expect(promise).to.become([ { result: 1 } ]);
      });
      it('should count.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : Kinvey.Group.count().toJSON()
        });
        return expect(promise).to.become([ { result: 2 } ]);
      });
      it('should sum.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : Kinvey.Group.sum('field').toJSON()
        });
        return expect(promise).to.become([ { result: 3 } ]);
      });
      it('should min.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : Kinvey.Group.min('field').toJSON()
        });
        return expect(promise).to.become([ { result: 1 } ]);
      });
      it('should max.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : Kinvey.Group.max('field').toJSON()
        });
        return expect(promise).to.become([ { result: 2 } ]);
      });
      it('should average.', function() {
        var promise = Kinvey.Persistence.Local.create({
          collection : this.collection,
          id         : '_group',
          data       : Kinvey.Group.average('field').toJSON()
        });
        return expect(promise).to.become([ { count: 2, result: 1.5 } ]);
      });
    });
  });

  // Kinvey.Persistence.Local.update.
  describe('the update method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this = this;
      return Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : { field: this.randomID() }
      }).then(function(response) {
        _this.doc = response;
      });
    });
    after(function() {// Delete the created documents (if any).
      return Kinvey.Persistence.Local.destroy({ collection: this.collection });
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should fail on invalid collection name.', function() {
      var promise = Kinvey.Persistence.Local.update({
        collection : true,
        id         : '_group',
        data       : { _id: this.randomID() }
      });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', 'InvalidIdentifier');
      });
    });
    it('should update a document.', function() {
      var document = { _id: this.randomID(), field: this.randomID() };
      var promise  = Kinvey.Persistence.Local.update({
        collection : this.collection,
        data       : document
      });
      return expect(promise).to.become(document);
    });
    it('should create the document when it does not exist.', function() {
      var promise = Kinvey.Persistence.Local.update({
        collection : this.collection,
        data       : { _id: this.randomID() }
      });
      return expect(promise).to.be.fulfilled;
    });
  });

  // Kinvey.Persistence.Local.destroy.
  describe('the destroy method', function() {
    // Housekeeping: create two documents.
    beforeEach(function() {
      var _this = this;
      return Kinvey.Persistence.Local.create({
        collection : this.collection,
        data       : [ { field: this.randomID() }, { field: this.randomID() } ]
      }).then(function(response) {
        _this.doc1 = response[0];
        _this.doc2 = response[1];
      });
    });
    afterEach(function() {// Delete the documents (if any).
      return Kinvey.Persistence.Local.destroy({ collection: this.collection });
    });
    afterEach(function() {// Cleanup.
      delete this.doc1;
      delete this.doc2;
    });

    // Test suite.
    it('should fail on invalid collection name.', function() {
      var promise = Kinvey.Persistence.Local.destroy({
        collection : true,
        id         : this.doc1._id
      });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', 'InvalidIdentifier');
      });
    });
    it('should delete a document.', function() {
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        id         : this.doc1._id
      });
      return expect(promise).to.eventually.have.property('count', 1);
    });
    it('should return the deleted document.', function() {
      var _this = this;
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        id         : this.doc1._id
      });
      return promise.then(function(response) {
        expect(response).to.have.property('documents');
        expect(response.documents).to.deep.equal([ _this.doc1 ]);
      });
    });
    it('should fail when the document does not exist.', function() {
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        id         : this.randomID()
      });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });
    it('should delete all documents.', function() {
      var promise = Kinvey.Persistence.Local.destroy({ collection: this.collection });
      return expect(promise).to.eventually.have.property('count', 2);
    });
    it('should return all documents deleted.', function() {
      var promise = Kinvey.Persistence.Local.destroy({ collection: this.collection });
      return promise.then(function(response) {
        expect(response).to.have.property('documents');
        expect(response.documents).to.be.an('array');
        expect(response.documents).to.have.length(2);

        // Inspect body.
        response.documents.forEach(function(document) {
          expect(document).to.have.property('_id');
        });
      });
    });
    it('should delete all documents, with filter:attribute.', function() {
      var query   = new Kinvey.Query().equalTo('field', this.doc1.field);
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        query      : query
      }).then(function(response) {
        expect(response).to.have.property('count', 1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, with filter:nonExistingAttribute.', function() {
      var query   = new Kinvey.Query().exists('nonExistingAttribute');
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        query      : query
      });
      return expect(promise).to.eventually.have.property('count', 0);
    });
    it('should delete all documents, regardless of sort.', function() {
      var query   = new Kinvey.Query().ascending('field');
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        query      : query
      });
      return expect(promise).to.eventually.have.property('count', 2);
    });
    it('should delete all documents, regardless of limit.', function() {
      var query   = new Kinvey.Query().limit(10);
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        query      : query
      });
      return expect(promise).to.eventually.have.property('count', 2);
    });
    it('should delete all documents, regardless of skip.', function() {
      var query   = new Kinvey.Query().skip(10);
      var promise = Kinvey.Persistence.Local.destroy({
        collection : this.collection,
        query      : query
      });
      return expect(promise).to.eventually.have.property('count', 2);
    });
  });

});