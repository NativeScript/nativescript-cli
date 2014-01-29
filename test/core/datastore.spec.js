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
 * Test suite for `Kinvey.DataStore`.
 */
describe('Kinvey.DataStore', function() {

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {
    Kinvey.setActiveUser(null);
  });

  // Kinvey.DataStore.find.
  describe('the find method', function() {
    // Housekeeping: create two documents.
    before(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc = doc;
      });
    });
    before(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc2 = doc;
      });
    });
    after(function() {// Delete the documents.
      var query = new Kinvey.Query().contains('_id', [ this.doc._id, this.doc2._id ]);
      return Kinvey.DataStore.clean(this.collection, query);
    });
    after(function() {// Cleanup.
      delete this.doc;
      delete this.doc2;
    });

    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      var _this = this;
      expect(function() {
        Kinvey.DataStore.find(_this.collection, {});
      }).to.Throw('Kinvey.Query');
    });
    it('should return all documents.', function() {
      var _this = this;
      var promise = Kinvey.DataStore.find(this.collection).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length.of.at.least(2);

        // Inspect array.
        var docIds = docs.map(function(doc) { return doc._id; });
        expect(docIds).to.contain(_this.doc._id);
        expect(docIds).to.contain(_this.doc2._id);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all documents, with filter:attribute.', function() {
      var _this = this;
      var query = new Kinvey.Query().equalTo('attribute', this.doc.attribute);
      var promise = Kinvey.DataStore.find(this.collection, query).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(1);

        // Inspect array.
        expect(docs[0]).to.deep.equal(_this.doc);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all documents, with filter:nonExistingAttribute.', function() {
      var query = new Kinvey.Query().exists('nonExistingAttribute');
      var promise = Kinvey.DataStore.find(this.collection, query);
      return expect(promise).to.become([]);
    });
    it('should return all documents, with sort:attribute.', function() {
      var query = new Kinvey.Query().ascending('attribute');
      var promise = Kinvey.DataStore.find(this.collection, query).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length.of.at.least(2);

        // Inspect array.
        for(var i = 1, j = docs.length; i < j; i += 1) {
          expect(docs[i - 1].attribute).to.be.lessThan(docs[i].attribute);
        }
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all documents, with limit.', function() {
      var query = new Kinvey.Query().limit(1);
      var promise = Kinvey.DataStore.find(this.collection, query).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all documents, with skip.', function() {
      var query = new Kinvey.Query().skip(1);
      var promise = Kinvey.DataStore.find(this.collection, query).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length.of.at.least(1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.find(this.collection, null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.DataStore.find(this.collection, null, options);
    }));

    // Test GeoSpatial querying.
    describe('with a GeoSpatial query', function() {
      // Housekeeping: create a document.
      before(function() {
        var doc = {
          _geoloc: [ 0, 0 ]
        };
        var _this = this;
        return Kinvey.DataStore.save(this.collection, doc).then(function(geoDoc) {
          _this.geoDoc = geoDoc;
        });
      });
      after(function() {// Delete the document.
        return Kinvey.DataStore.destroy(this.collection, this.geoDoc._id);
      });
      after(function() {// Cleanup.
        delete this.geoDoc;
      });

      // Test suite.
      it('should return all documents near a coordinate.', function() {
        var query = new Kinvey.Query().near('_geoloc', [1, 1]);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ this.geoDoc ]);
      });
      it('should return all documents near a coordinate, with `maxDistance`.', function() {
        var query = new Kinvey.Query().near('_geoloc', [1, 1], 1);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ ]);
      });
      it('should return all documents within a box: match.', function() {
        var query = new Kinvey.Query().withinBox('_geoloc', [-1, -1], [1, 1]);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ this.geoDoc ]);
      });
      it('should return all documents within a box: no match.', function() {
        var query = new Kinvey.Query().withinBox('_geoloc', [-2, -2], [-1, -1]);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ ]);
      });
      it('should return all documents within a polygon: match.', function() {
        var query = new Kinvey.Query().withinPolygon('_geoloc', [ [-1, -1], [-1, 1], [1, 1] ]);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ this.geoDoc ]);
      });
      it('should return all documents within a polygon: no match.', function() {
        var query = new Kinvey.Query().withinPolygon('_geoloc', [ [-2, -2], [-2, -1], [-1, -1] ]);
        var promise = Kinvey.DataStore.find(this.collection, query);
        return expect(promise).to.become([ ]);
      });
    });
  });

  // Kinvey.DataStore.get.
  describe('the get method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc = doc;
      });
    });
    after(function() {// Delete the document.
      return Kinvey.DataStore.destroy(this.collection, this.doc._id);
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should fail when the document does not exist.', function() {
      var promise = Kinvey.DataStore.get(this.collection, this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });
    it('should return the document.', function() {
      var promise = Kinvey.DataStore.get(this.collection, this.doc._id);
      return expect(promise).to.become(this.doc);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.get(this.collection, this.doc._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.DataStore.get(this.randomID(), this.randomID(), options);
    }));
  });

  // Kinvey.DataStore.save.
  describe('the save method', function() {
    // Housekeeping: spy on Kinvey.DataStore.update.
    before(function() {
      sinon.spy(Kinvey.DataStore, 'update');
    });
    afterEach(function() {// Reset spy.
      Kinvey.DataStore.update.reset();
    });
    after(function() {// Restore original.
      Kinvey.DataStore.update.restore();
    });

    // Housekeeping: delete any created documents.
    after(function() {
      return Kinvey.DataStore.clean(this.collection);
    });

    // Test suite.
    it('should create a new document.', function() {
      var doc = { attribute: this.randomID() };
      var promise = Kinvey.DataStore.save(this.collection, doc).then(function(response) {
        expect(response).to.have.property('_id');
        expect(response).to.have.deep.property('_acl.creator', Kinvey.getActiveUser()._id);
        expect(response).to.have.property('attribute', doc.attribute);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should update an existing document.', function() {
      var doc = { _id: this.randomID() };
      var promise = Kinvey.DataStore.save(this.collection, doc).then(function(response) {
        expect(response).to.have.property('_id', doc._id);
        expect(Kinvey.DataStore.update).to.be.calledOnce;
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      var doc = { attribute: this.randomID() };
      return Kinvey.DataStore.save(this.collection, doc, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.DataStore.save(this.collection, {}, options);
    }));
  });

  // Kinvey.DataStore.update.
  describe('the update method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc = doc;
      });
    });
    after(function() {// Delete the document.
      return Kinvey.DataStore.destroy(this.collection, this.doc._id);
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Housekeeping: delete any newly created documents.
    after(function() {
      return Kinvey.DataStore.clean(this.collection);
    });

    // Test suite.
    it('should throw when missing required argument: document._id.', function() {
      var _this = this;
      expect(function() {
        Kinvey.DataStore.update(_this.collection, {});
      }).to.Throw('_id');
    });
    it('should create a new document when the document does not exist.', function() {
      var doc = { _id: this.randomID() };
      var promise = Kinvey.DataStore.update(this.collection, doc).then(function(response) {
        expect(response).to.have.property('_id', doc._id);
        expect(response).to.have.deep.property('_acl.creator', Kinvey.getActiveUser()._id);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should update an existing document', function() {
      this.doc.attribute = this.randomID();// Update field.

      var _this = this;
      var promise = Kinvey.DataStore.update(this.collection, this.doc).then(function(response) {
        expect(response).to.have.property('_id', _this.doc._id);
        expect(response).to.have.property('attribute', _this.doc.attribute);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.update(this.collection, this.doc, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.DataStore.update(this.collection, this.doc, options);
    }));
  });

  // Kinvey.DataStore.clean.
  describe('the clean method', function() {
    // Housekeeping: create two documents.
    beforeEach(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc = doc;
      });
    });
    beforeEach(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc2 = doc;
      });
    });
    afterEach(function() {// Delete the documents.
      Kinvey.appKey = config.test.appKey;// Reset.
      var query = new Kinvey.Query().contains('_id', [ this.doc._id, this.doc2._id ]);
      return Kinvey.DataStore.clean(this.collection, query);
    });
    afterEach(function() {// Cleanup.
      delete this.doc;
      delete this.doc2;
    });

    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      var _this = this;
      expect(function() {
        Kinvey.DataStore.clean(_this.collection, {});
      }).to.Throw('Kinvey.Query');
    });
    it('should delete all documents.', function() {
      var promise = Kinvey.DataStore.clean(this.collection).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.be.at.least(2);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, with filter:attribute.', function() {
      var query = new Kinvey.Query().equalTo('attribute', this.doc.attribute);
      var promise = Kinvey.DataStore.clean(this.collection, query).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.equal(1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, with filter:nonExistingAttribute.', function() {
      var query = new Kinvey.Query().exists('nonExistingAttribute');
      var promise = Kinvey.DataStore.clean(this.collection, query).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.equal(0);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, regardless of sort.', function() {
      var query = new Kinvey.Query().ascending('attribute');
      var promise = Kinvey.DataStore.clean(this.collection, query).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.be.at.least(2);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, regardless of limit.', function() {
      var query = new Kinvey.Query().limit(1);
      var promise = Kinvey.DataStore.clean(this.collection, query).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.be.at.least(2);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should delete all documents, regardless of skip.', function() {
      var query = new Kinvey.Query().skip(1);
      var promise = Kinvey.DataStore.clean(this.collection, query).then(function(response) {
        expect(response).to.have.property('count');
        expect(response.count).to.be.at.least(2);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.clean(this.collection, null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.DataStore.clean(this.collection, null, options);
    }));
  });

  // Kinvey.DataStore.destroy.
  describe('the destroy method', function() {
    // Housekeeping: create a document.
    beforeEach(function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { attribute: this.randomID() });
      return promise.then(function(doc) {
        _this.doc = doc;
      });
    });
    afterEach(function() {// Delete the document (if not already done).
      return Kinvey.DataStore.destroy(this.collection, this.doc._id, { silent: true });
    });
    afterEach(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should delete the document.', function() {
      var promise = Kinvey.DataStore.destroy(this.collection, this.doc._id);
      return expect(promise).to.eventually.have.property('count', 1);
    });
    it('should fail when the document does not exist.', function() {
      var promise = Kinvey.DataStore.destroy(this.collection, this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });
    it(
      'should succeed when the document does not exist, and the `silent` flag was set.',
      function() {
        var promise = Kinvey.DataStore.destroy(this.collection, this.randomID(), { silent: true });
        return expect(promise).to.eventually.have.property('count', 0);
      }
    );
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.destroy(this.collection, this.doc._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.DataStore.destroy(this.collection, this.randomID(), options);
    }));
  });

  // Kinvey.DataStore.count.
  describe('the count method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, { field: this.randomID() }).then(function(doc) {
        _this.doc = doc;
      });
    });
    after(function() {// Delete the document.
      return Kinvey.DataStore.destroy(this.collection, this.doc._id);
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should count the number of documents.', function() {
      var promise = Kinvey.DataStore.count(this.collection);
      return expect(promise).to.be.fulfilled;
    });
    it('should count the number of documents, with query.', function() {
      var query = new Kinvey.Query().equalTo('field', this.doc.field);
      var promise = Kinvey.DataStore.count(this.collection, query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents on a non-existing collection.', function() {
      var promise = Kinvey.DataStore.count(this.randomID());
      return expect(promise).to.become(0);
    });
    it('should count the number of documents, regardless of sort.', function() {
      var query = new Kinvey.Query().equalTo('field', this.doc.field).ascending(this.randomID());
      var promise = Kinvey.DataStore.count(this.collection, query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents, regardless of limit.', function() {
      var query = new Kinvey.Query().equalTo('field', this.doc.field).limit(10);
      var promise = Kinvey.DataStore.count(this.collection, query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents, regardless of skip.', function() {
      var query = new Kinvey.Query().equalTo('field', this.doc.field).skip(10);
      var promise = Kinvey.DataStore.count(this.collection, query);
      return expect(promise).to.become(1);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.count(this.collection, null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.DataStore.count(this.collection, null, options);
    }));
  });

  // Kinvey.DataStore.group.
  describe('the group method', function() {
    // Housekeeping: create two documents.
    before(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, { field: 1 }).then(function(doc) {
        _this.doc = doc;
      });
    });
    before(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, { field: 2 }).then(function(doc) {
        _this.doc2 = doc;
      });
    });
    after(function() {// Delete the documents.
      var query = new Kinvey.Query().contains('_id', [ this.doc._id, this.doc2._id ]);
      return Kinvey.DataStore.clean(this.collection, query);
    });
    after(function() {// Cleanup.
      delete this.doc;
      delete this.doc2;
    });

    // Housekeeping: define an empty aggregation.
    beforeEach(function() {
      this.agg = new Kinvey.Group();
    });
    afterEach(function() {// Cleanup.
      delete this.agg;
    });

    // Test suite.
    it('should fail on invalid arguments: aggregation.', function() {
      var _this = this;
      expect(function() {
        Kinvey.DataStore.group(_this.collection, null);
      }).to.Throw('Kinvey.Group');
    });
    it('should accept an empty aggregation.', function() {
      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return expect(promise).to.become([{}]);
    });
    it('should group by.', function() {
      this.agg.by('field');
      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return promise.then(function(response) {
        expect(response).to.have.deep.property('[0].field');
        expect(response).to.have.deep.property('[1].field');
      });
    });
    it('should group by, with sort, limit, and skip.', function() {
      var query = new Kinvey.Query().descending('field').limit(1).skip(1);
      this.agg.by('field').query(query);
      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return expect(promise).to.become([ { field: 1 } ]);
    });
    it('should group with query.', function() {
      var query = new Kinvey.Query().equalTo('field', this.doc.field);
      this.agg.by('field').query(query);

      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return expect(promise).to.become([ { field: 1 }]);
    });
    it('should group with initial.', function() {
      var initial = { field : 0 };
      this.agg.initial(initial);

      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return expect(promise).to.become([ initial ]);
    });
    it('should group with reduce.', function() {
      this.agg.initial('result', 0);
      this.agg.reduce(function(doc, out) {
        out.result = 1;
      });

      var promise = Kinvey.DataStore.group(this.collection, this.agg);
      return expect(promise).to.become([ { result: 1 } ]);
    });

    it('should count.', function() {
      var promise = Kinvey.DataStore.group(this.collection, Kinvey.Group.count());
      return expect(promise).to.become([ { result: 2 } ]);
    });
    it('should sum.', function() {
      var promise = Kinvey.DataStore.group(this.collection, Kinvey.Group.sum('field'));
      return expect(promise).to.become([ { result: 3 } ]);
    });
    it('should min.', function() {
      var promise = Kinvey.DataStore.group(this.collection, Kinvey.Group.min('field'));
      return expect(promise).to.become([ { result: 1 } ]);
    });
    it('should max.', function() {
      var promise = Kinvey.DataStore.group(this.collection, Kinvey.Group.max('field'));
      return expect(promise).to.become([ { result: 2 } ]);
    });
    it('should average.', function() {
      var promise = Kinvey.DataStore.group(this.collection, Kinvey.Group.average('field'));
      return expect(promise).to.become([ { count: 2, result: 1.5 } ]);
    });

    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.DataStore.group(this.collection, this.agg, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      this.agg.reduce(this.randomID());// Force failure.
      return Kinvey.DataStore.group(this.collection, this.agg, options);
    }));
  });

  // If there is no adapter, skip the test suite.
  var localDescribe = (function() {
    try {
      Kinvey.Persistence.Local.read({ id: '_count' });
      return describe;
    }
    catch(e) {
      return describe.skip;
    }
  }());

  // maxAge.
  localDescribe('the maxAge option', function() {
    // Housekeeping: enable sync.
    before(function() {
      return Kinvey.Sync.init({ enable: true });
    });
    after(function() {
      return Kinvey.Sync.init({ enable: false });
    });

    // Housekeeping: ensure app is online.
    beforeEach(function() {
      return Kinvey.Sync.online({ sync: false });
    });

    // Housekeeping: delete the created document (if any).
    afterEach(function() {
      return Kinvey.DataStore.clean(this.collection);
    });

    // Tests.
    it('should be set when saving.', function() {
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: 3600 });
      return promise.then(function(response) {
        expect(response).to.have.deep.property('_kmd.lastRefreshedAt');
        expect(response).to.have.deep.property('_kmd.maxAge');
      });
    });
    it('should use local persistence if not expired.', function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: 3600 });
      return promise.then(function(netResponse) {
        promise = Kinvey.DataStore.get(_this.collection, netResponse._id, { offline: true });
        return promise.then(function(localResponse) {
          expect(netResponse).to.deep.equal(localResponse);
        });
      });
    });
    it('should use network persistence if expired.', function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: -1 });
      return promise.then(function(netResponse) {
        promise = Kinvey.DataStore.get(_this.collection, netResponse._id, { offline: true });
        return promise.then(function(localResponse) {
          // Document should have been refreshed.
          expect(netResponse._kmd.lastRefreshedAt).not.to.equal(localResponse._kmd.lastRefreshedAt);
        });
      });
    });
    it('should use local persistence if expired but offline.', function() {
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: -1 });
      return promise.then(function(netResponse) {
        return Kinvey.Sync.offline().then(function() {
          promise = Kinvey.DataStore.get(_this.collection, netResponse._id, { offline: true });
          return promise.then(function(localResponse) {
            // Document should not have been refreshed.
            expect(netResponse._kmd.lastRefreshedAt).to.equal(localResponse._kmd.lastRefreshedAt);
          });
        });
      });
    });
    it('should update local persistence if expired.', function() {
      var maxAge  = 3600;
      var _this   = this;
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: -1 });
      return promise.then(function(netResponse) {
        promise = Kinvey.DataStore.get(_this.collection, netResponse._id, {
          maxAge  : maxAge,
          offline : true
        });
        return promise.then(function(localResponse) {
          expect(localResponse).to.have.deep.property('_kmd.maxAge', maxAge);
          expect(netResponse._kmd.lastRefreshedAt).not.to.equal(localResponse._kmd.lastRefreshedAt);
        });
      });
    });
    it('should refresh in the background if maxAge is over 90% expired.', function() {
      // NOTE This test times out on failure.
      var maxAge = 10;
      var _this  = this;
      var promise = Kinvey.DataStore.save(this.collection, { }, { maxAge: maxAge });
      return promise.then(function(netResponse) {
        var deferred = Kinvey.Defer.deferred();

        // Background request should have been made to network.
        var stub = sinon.stub(Kinvey.Persistence.Net, 'read', function() {
          deferred.resolve();
          stub.restore();
        });
        setTimeout(function() {
          var promise = Kinvey.DataStore.get(_this.collection, netResponse._id, { offline: true });
          promise.then(null, deferred.reject);
        }, maxAge * 950);// 95% (ms).

        return deferred.promise;
      });
    });
  });
});