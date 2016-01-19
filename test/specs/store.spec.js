import Store from '../../src/core/stores/store';
import Query from '../../src/core/query';
import { StoreType } from '../../src/core/enums';
import { NotFoundError } from '../../src/core/errors';
import { randomString, loginUser, logoutUser } from '../utils';
const collectionName = 'tests';

describe('Store', function() {
  before(function() {
    return loginUser().then(user => {
      this.activeUser = user;
    });
  });

  after(function() {
    return logoutUser();
  });

  after(function() {
    delete this.activeUser;
  });

  before(function() {
    this.store = Store.getInstance(collectionName);
  });

  after(function() {
    delete this.store;
  });

  describe('find()', function() {
    before(function() {
      return this.store.save({
        attribute: randomString()
      }).then(doc => {
        this.doc = doc;
      });
    });

    after(function() {
      return this.store.remove(this.doc._id);
    });

    after(function() {
      delete this.doc;
    });

    before(function() {
      return this.store.save({
        attribute: randomString()
      }).then(doc => {
        this.doc2 = doc;
      });
    });

    after(function() {
      return this.store.remove(this.doc2._id);
    });

    after(function() {
      delete this.doc2;
    });

    it('should respond', function() {
      expect(Store).to.respondTo('find');
    });

    it('should return all docs', function() {
      return this.store.find().then(docs => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(2);

        const docIds = docs.map(doc => {
          return doc._id;
        });
        expect(docIds).to.contain(this.doc._id);
        expect(docIds).to.contain(this.doc2._id);
      });
    });

    describe('with a query', function() {
      it('should be rejected when provided an invalid query', function() {
        return expect(this.store.find({})).to.be.rejected;
      });

      it('should return all documents with field selection', function() {
        const query = new Query();
        query.fields(['_id']);
        return this.store.find(query).then(docs => {
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(2);

          docs.forEach(doc => {
            expect(doc).to.have.property('_id');
            expect(doc).not.to.have.property('attribute');
          });
        });
      });

      it('should return all documents with filter:attribute', function() {
        const query = new Query();
        query.equalTo('attribute', this.doc.attribute);
        return this.store.find(query).then(docs => {
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(1);
          expect(docs[0]).to.deep.equal(this.doc);
        });
      });

      it('should return all documents with filter:nonExistingAttribute', function() {
        const query = new Query();
        query.exists('nonExistingAttribute');
        const promise = this.store.find(query);
        return expect(promise).to.become([]);
      });

      it('should return all documents sorted when a sort order is specified', function() {
        const query = new Query();
        query.ascending('attribute');
        return this.store.find(query).then(docs => {
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(2);

          for (let i = 1, j = docs.length; i < j; i += 1) {
            expect(docs[i - 1].attribute).to.be.lessThan(docs[i].attribute);
          }
        });
      });

      it('should return 1 document with a limit of 1 specified', function() {
        const query = new Query();
        query.limit(1);
        return this.store.find(query).then(docs => {
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(1);
        });
      });

      it('should return 1 document with a skip of 1 specified', function() {
        const query = new Query();
        query.skip(1);
        return this.store.find(query).then(docs => {
          expect(docs).to.be.an('array');
          expect(docs).to.have.length(1);
        });
      });
    });

    describe('with a GeoSpatial query', function() {
      before(function() {
        this.networkStore = Store.getInstance(collectionName, StoreType.Network);
      });

      before(function() {
        return this.networkStore.save({
          _geoloc: [0, 0]
        }).then(geoDoc => {
          this.geoDoc = geoDoc;
        });
      });

      after(function() {
        return this.networkStore.remove(this.geoDoc._id);
      });

      after(function() {
        delete this.geoDoc;
      });

      after(function() {
        delete this.networkStore;
      });

      it('should return all documents near a coordinate', function() {
        const query = new Query();
        query.near('_geoloc', [1, 1]);
        return expect(this.networkStore.find(query)).to.become([this.geoDoc]);
      });

      it('should return all documents near a coordinate, with a maxDistance', function() {
        const query = new Query();
        query.near('_geoloc', [1, 1], 1);
        return expect(this.networkStore.find(query)).to.become([]);
      });

      it('should return all documents within a box: match', function() {
        const query = new Query();
        query.withinBox('_geoloc', [-1, -1], [1, 1]);
        return expect(this.networkStore.find(query)).to.become([this.geoDoc]);
      });

      it('should return all documents within a box: no match', function() {
        const query = new Query();
        query.withinBox('_geoloc', [-2, -2], [-1, -1]);
        return expect(this.networkStore.find(query)).to.become([]);
      });

      it('should return all documents within a polygon: match', function() {
        const query = new Query();
        query.withinPolygon('_geoloc', [[-1, -1], [-1, 1], [1, 1]]);
        return expect(this.networkStore.find(query)).to.become([this.geoDoc]);
      });

      it('should return all documents within a polygon: no match', function() {
        const query = new Query();
        query.withinPolygon('_geoloc', [[-2, -2], [-2, -1], [-1, -1]]);
        return expect(this.networkStore.find(query)).to.become([]);
      });
    });
  });

  describe('get()', function() {
    before(function() {
      return this.store.save({
        attribute: randomString()
      }).then(doc => {
        this.doc = doc;
      });
    });

    after(function() {
      return this.store.remove(this.doc._id);
    });

    after(function() {
      delete this.doc;
    });

    it('should respond', function() {
      expect(Store).to.respondTo('get');
    });

    it('should fail when the document does not exist', function() {
      const promise = this.store.get(randomString());
      return promise.then(() => {
        expect(promise).to.be.rejected;
      }).catch(err => {
        expect(err).to.be.instanceof(NotFoundError);
      });
    });

    it('should return the document', function() {
      return expect(this.store.get(this.doc._id)).to.become(this.doc);
    });
  });

  describe('save()', function() {
    before(function() {
      sinon.spy(this.store, 'update');
    });

    afterEach(function() {
      this.store.update.reset();
    });

    after(function() {
      this.store.update.restore();
    });

    after(function() {
      this.store.clear();
    });

    it('should create a new document', function() {
      const doc = { attribute: randomString() };
      return this.store.save(doc).then(data => {
        expect(data).to.have.property('_id');
        expect(data).to.have.deep.property('_acl.creator', this.activeUser._id);
        expect(data).to.have.property('attribute', doc.attribute);
      });
    });

    it('should update an existing document', function() {
      const doc = { _id: randomString() };
      return this.store.save(doc).then(data => {
        expect(data).to.have.property('_id', doc._id);
        expect(this.store.update).to.be.calledOnce;
      });
    });
  });

  describe('update()', function() {
    before(function() {
      return this.store.save({
        attribute: randomString()
      }).then(doc => {
        this.doc = doc;
      });
    });

    after(function() {
      return this.store.remove(this.doc._id);
    });

    after(function() {
      delete this.doc;
    });

    after(function() {
      return this.store.clear();
    });

    it('should reject when document argument is missing an _id');

    it('should create a new document when the document does not exist', function() {
      const doc = { _id: randomString() };
      return this.store.update(doc).then(updatedDoc => {
        expect(updatedDoc).to.have.property('_id', doc._id);
        expect(updatedDoc).to.have.deep.property('_acl.creator', this.activeUser._id);
      });
    });

    it('should update an existing document', function() {
      this.doc.attribute = randomString();
      return this.store.update(this.doc).then(updatedDoc => {
        expect(updatedDoc).to.have.property('_id', this.doc._id);
        expect(updatedDoc).to.have.property('attribute', this.doc.attribute);
      });
    });
  });
});
