const DataStore = require('../../src/legacy/datastore');
const Query = require('../../src/core/query');
const Aggregation = require('../../src/core/aggregation');
const nock = require('nock');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const collectionName = 'books';

describe('DataStore', function() {
  before(function() {
    return loginUser().then(user => {
      this.activeUser = user;
    });
  });

  // after(function() {
  //   return logoutUser();
  // });

  describe('find()', function() {
    before(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc = doc;
      });
    });

    before(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc2 = doc;
      });
    });

    after(function() {
      const query = new Query();
      query.contains('_id', [this.doc._id, this.doc2._id]);

      return DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      });
    });

    after(function() {
      delete this.doc;
      delete this.doc2;
    });

    it('should reject promise with invalid arguments: query', function() {
      const promise = DataStore.find(collectionName, {}, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.be.rejectedWith('Kinvey.Query');
    });

    it('should return all documents', function() {
      const promise = DataStore.find(collectionName, null, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(2);

        const docIds = docs.map(doc => { return doc._id; });
        expect(docIds).to.contain(this.doc._id);
        expect(docIds).to.contain(this.doc2._id);
      });

      return promise;
    });

    it('should return all documents, with field selection through a query', function() {
      const query = new Query();
      query.fields(['_id']);
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(2);

        docs.forEach(doc => {
          expect(doc).to.have.property('_id');
          expect(doc).not.to.have.property('attribute');
        });
      });

      return promise;
    });

    it('should return all documents, with filter:attribue', function() {
      const query = new Query();
      query.equalTo('attribute', this.doc.attribute);
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(1);
        expect(docs[0]).to.deep.equal(this.doc);
      });

      return promise;
    });

    it('should return all documents, with filter:nonExistingAttribute', function() {
      const query = new Query();
      query.exists('nonExistingAttribute');
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([]);
    });

    it('should return all documents, with sort:attribute', function() {
      const query = new Query();
      query.ascending('attribute');
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(2);

        for (let i = 1, j = docs.length; i < j; i++) {
          expect(docs[i - 1].attribute).to.be.lessThan(docs[i].attribute);
        }
      });

      return promise;
    });

    it('should return all documents, with limit', function() {
      const query = new Query();
      query.limit(1);
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(1);
      });

      return promise;
    });

    it('should return all documents, with skip', function() {
      const query = new Query();
      query.skip(1);
      const promise = DataStore.find(collectionName, query, {
        offline: true,
        fallback: false
      }).then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(1);
      });

      return promise;
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.find(collectionName, null, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.find(collectionName, {}, options);
    }));

    describe('with a GeoSpatial query', function() {
      before(function() {
        const reply = {
          _id: randomString(24),
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          },
          _acl: {
            creator: this.activeUser._id
          },
          _geoloc: [0, 0]
        };

        nock(this.client.apiUrl)
          .post(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .reply(201, reply, {
            'content-type': 'application/json'
          });

        const doc = {
          _geoloc: reply._geoloc
        };
        return DataStore.save(collectionName, doc).then(geoDoc => {
          this.geoDoc = geoDoc;
        });
      });

      after(function() {
        const reply = {
          count: 1
        };

        nock(this.client.apiUrl)
          .delete(`/${appdataNamespace}/${this.client.appId}/${collectionName}/${this.geoDoc._id}`)
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        return DataStore.destroy(collectionName, this.geoDoc._id);
      });

      after(function() {
        delete this.geoDoc;
      });

      it('should return all documents near a coordinate', function() {
        const reply = [this.geoDoc];
        const query = new Query();
        query.near('_geoloc', [1, 1]);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([this.geoDoc]);
      });

      it('should return all documents near a coordinate, with maxDistance', function() {
        const reply = [this.geoDoc];
        const query = new Query();
        query.near('_geoloc', [1, 1], 1);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([this.geoDoc]);
      });

      it('should return all documents within a box: match', function() {
        const reply = [this.geoDoc];
        const query = new Query();
        query.withinBox('_geoloc', [-1, -1], [1, 1]);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([this.geoDoc]);
      });

      it('should return all documents within a box: no match', function() {
        const reply = [];
        const query = new Query();
        query.withinBox('_geoloc', [-2, -2], [-1, -1]);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([]);
      });

      it('should return all documents within a polygon: match', function() {
        const reply = [this.geoDoc];
        const query = new Query();
        query.withinPolygon('_geoloc', [[-1, -1], [-1, 1], [1, 1]]);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([this.geoDoc]);
      });

      it('should return all documents within a polygon: no match', function() {
        const reply = [];
        const query = new Query();
        query.withinPolygon('_geoloc', [[-2, -2], [-2, -1], [-1, -1]]);

        nock(this.client.apiUrl)
          .get(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
          .query(createNockQuery(query))
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = DataStore.find(collectionName, query);
        return expect(promise).to.become([]);
      });
    });
  });

  describe('group()', function() {
    before(function() {
      return DataStore.save(collectionName, {
        field: 1
      }, {
        offline: true,
        fallback: false
      }).then(doc => {
        this.doc = doc;
      });
    });

    before(function() {
      return DataStore.save(collectionName, {
        field: 2
      }, {
        offline: true,
        fallback: false
      }).then(doc => {
        this.doc2 = doc;
      });
    });

    after(function() {
      const query = new Query();
      query.contains('_id', [this.doc._id, this.doc2._id]);
      return DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      });
    });

    after(function() {
      delete this.doc;
      delete this.doc2;
    });

    beforeEach(function() {
      this.aggregation = new Aggregation();
    });

    afterEach(function() {
      delete this.aggregation;
    });

    it('should fail on invalid arguments: aggregation', function() {
      const promise = DataStore.group(collectionName, null, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.be.rejectedWith('Kinvey.Group');
    });

    it('should accept an empty aggregation', function() {
      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{}]);
    });

    it('should group by', function() {
      this.aggregation.by('field');
      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return promise.then(response => {
        expect(response).to.have.deep.property('[0].field');
        expect(response).to.have.deep.property('[1].field');
      });
    });

    it('should group by, with sort, limit, and skip', function() {
      const query = new Query();
      query.descending('field').limit(1).skip(1);
      this.aggregation.by('field').query(query);
      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ field: 1 }]);
    });

    it('should group with query', function() {
      const query = new Query();
      query.equalTo('field', this.doc.field);
      this.aggregation.by('field').query(query);

      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ field: 1 }]);
    });

    it('should group with initial', function() {
      const initial = { field: 0 };
      this.aggregation.initial(initial);
      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([initial]);
    });

    it('should group with reduce', function() {
      this.aggregation.initial('result', 0);
      this.aggregation.reduce(function(doc, out) {
        out.result = 1;
      });
      const promise = DataStore.group(collectionName, this.aggregation, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ result: 1 }]);
    });

    it('should count', function() {
      const promise = DataStore.group(collectionName, Aggregation.count(), {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ result: 2 }]);
    });

    it('should sum', function() {
      const promise = DataStore.group(collectionName, Aggregation.sum('field'), {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ result: 3 }]);
    });

    it('should min', function() {
      const promise = DataStore.group(collectionName, Aggregation.min('field'), {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ result: 1 }]);
    });

    it('should max', function() {
      const promise = DataStore.group(collectionName, Aggregation.max('field'), {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ result: 2 }]);
    });

    it('should average', function() {
      const promise = DataStore.group(collectionName, Aggregation.average('field'), {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become([{ count: 2, result: 1.5 }]);
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.group(collectionName, this.aggregation, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.group(this.collection, {}, options);
    }));
  });

  describe('get()', function() {
    before(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc = doc;
      });
    });

    after(function() {
      return DataStore.destroy(collectionName, this.doc._id, {
        offline: true,
        fallback: false
      });
    });

    after(function() {
      delete this.doc;
    });

    it('should fail when the document does not exist', function() {
      const id = randomString();
      const promise = DataStore.get(collectionName, id, {
        offline: true,
        fallback: false
      });
      return promise.then(() => {
        return expect(promise).to.be.rejected;
      }).catch(err => {
        expect(err).to.be.instanceof(Error);
      });
    });

    it('should return the document', function() {
      const promise = DataStore.get(collectionName, this.doc._id, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.become(this.doc);
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.get(collectionName, this.doc._id, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.get(collectionName, randomString(), options);
    }));
  });

  describe('save()', function() {
    before(function() {
      sinon.spy(DataStore, 'update');
    });

    afterEach(function() {
      DataStore.update.reset();
    });

    after(function() {
      DataStore.update.restore();
    });

    after(function() {
      return DataStore.clean(collectionName, null, {
        offline: true,
        fallback: false
      });
    });

    it('should create a new document', function() {
      const doc = {
        attribute: randomString()
      };
      const promise = DataStore.save(collectionName, doc, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('_id');
        expect(response).to.have.property('attribute', doc.attribute);
      });

      return promise;
    });

    it('should update an existing document', function() {
      const doc = {
        _id: randomString(24)
      };
      const promise = DataStore.save(collectionName, doc, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('_id', doc._id);
        expect(DataStore.update).to.be.calledOnce;
      });

      return promise;
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      const doc = {
        attribute: randomString()
      };
      options.offline = true;
      options.fallack = false;
      return DataStore.save(collectionName, doc, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      const reply = {
        error: 'KinveyInternalErrorRetry',
        description: 'The Kinvey server encountered an unexpected error. Please retry your request.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .post(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
        .reply(500, reply, {
          'content-type': 'application/json'
        });

      return DataStore.save(collectionName, {}, options);
    }));
  });

  describe('update()', function() {
    before(function() {
      const promise = DataStore.save(collectionName, {
        _id: randomString(24),
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc = doc;
      });
    });

    after(function() {
      return DataStore.destroy(collectionName, this.doc._id, {
        offline: true,
        fallback: false
      });
    });

    after(function() {
      delete this.doc;
    });

    it('should reject when missing required argument: document._id', function() {
      const promise = DataStore.update(collectionName, {});
      return expect(promise).to.be.rejectedWith('_id');
    });

    it('should update an existing document', function() {
      this.doc.attribute = randomString();
      const promise = DataStore.update(collectionName, this.doc, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('_id', this.doc._id);
        expect(response).to.have.property('attribute', this.doc.attribute);
      });

      return promise;
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      this.doc.attribute = randomString();
      options.offline = true;
      options.fallack = false;
      return DataStore.update(collectionName, this.doc, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      const reply = {
        error: 'KinveyInternalErrorRetry',
        description: 'The Kinvey server encountered an unexpected error. Please retry your request.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .put(`/${appdataNamespace}/${this.client.appId}/${collectionName}/${this.doc._id}`)
        .reply(500, reply, {
          'content-type': 'application/json'
        });

      this.doc.attribute = randomString;
      return DataStore.update(collectionName, this.doc, options);
    }));
  });

  describe('clean()', function() {
    beforeEach(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc = doc;
      });
    });

    beforeEach(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc2 = doc;
      });
    });

    afterEach(function() {
      const query = new Query();
      query.contains('_id', [this.doc._id, this.doc2._id]);
      return DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      });
    });

    afterEach(function() {
      delete this.doc;
      delete this.doc2;
    });

    it('should reject on invalid arguments: query', function() {
      const promise = DataStore.clean(collectionName, {});
      return expect(promise).to.be.rejectedWith('Kinvey.Query');
    });

    it('should delete all documents', function() {
      const promise = DataStore.clean(collectionName, null, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 2);
      });

      return promise;
    });

    it('should delete all documents, with filter:attribute', function() {
      const query = new Query();
      query.equalTo('attribute', this.doc.attribute);

      const promise = DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 1);
      });

      return promise;
    });

    it('should delete all documents, with filter:nonExistingAttribute', function() {
      const query = new Query();
      query.exists('nonExistingAttribute');

      const promise = DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 0);
      });

      return promise;
    });

    it('should delete all documents, regardless of sort', function() {
      const query = new Query();
      query.ascending('attribute');

      const promise = DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 2);
      });

      return promise;
    });

    it('should delete all documents, regardless of limit', function() {
      const query = new Query();
      query.limit(1);

      const promise = DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 2);
      });

      return promise;
    });

    it('should delete all documents, regardless of skip', function() {
      const query = new Query();
      query.skip(1);

      const promise = DataStore.clean(collectionName, query, {
        offline: true,
        fallback: false
      }).then(response => {
        expect(response).to.have.property('count', 2);
      });

      return promise;
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.clean(collectionName, null, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      const reply = {
        error: 'KinveyInternalErrorRetry',
        description: 'The Kinvey server encountered an unexpected error. Please retry your request.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .delete(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
        .reply(500, reply, {
          'content-type': 'application/json'
        });

      return DataStore.clean(collectionName, null, options);
    }));
  });

  describe('destroy()', function() {
    beforeEach(function() {
      const promise = DataStore.save(collectionName, {
        attribute: randomString()
      }, {
        offline: true,
        fallback: false
      });
      return promise.then(doc => {
        this.doc = doc;
      });
    });

    afterEach(function() {
      return DataStore.destroy(collectionName, this.doc._id, {
        offline: true,
        fallback: false,
        silent: true
      });
    });

    afterEach(function() {
      delete this.doc;
    });

    it('should delete the document', function() {
      const promise = DataStore.destroy(collectionName, this.doc._id, {
        offline: true,
        fallback: false
      });
      return expect(promise).to.eventually.have.property('count', 1);
    });

    it('should fail when the document does not exist', function() {
      const promise = DataStore.destroy(collectionName, randomString(), {
        offline: true,
        fallback: false
      });
      return promise.then(() => {
        return expect(promise).to.be.rejected;
      }).catch(err => {
        expect(err).to.be.instanceof(Error);
      });
    });

    it('should support both deferreds and callbacks on success', Common.success(function(options) {
      options.offline = true;
      options.fallack = false;
      return DataStore.destroy(collectionName, this.doc._id, options);
    }));

    it('should support both deferreds and callbacks on failure', Common.failure(function(options) {
      const reply = {
        error: 'KinveyInternalErrorRetry',
        description: 'The Kinvey server encountered an unexpected error. Please retry your request.',
        debug: ''
      };

      nock(this.client.apiUrl)
        .delete(`/${appdataNamespace}/${this.client.appId}/${collectionName}`)
        .reply(500, reply, {
          'content-type': 'application/json'
        });

      return DataStore.destroy(collectionName, this.doc._id, options);
    }));
  });
});
