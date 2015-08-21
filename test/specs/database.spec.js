import Database from '../../src/core/database';
import Query from '../../src/core/query';
const collection = 'posts';

describe('Database', function() {
  beforeEach(function() {
    this.database = Database.sharedInstance();
  });

  afterEach(function() {
    delete this.database;
  });

  describe('constructor()', function() {
    it('should return a new database', function() {
      expect(new Database()).to.be.an.instanceOf(Database);
    });
  });

  describe('fetch()', function() {
    before(function() {
      const database = Database.sharedInstance();
      const promise = database.save(collection, {attribute: global.randomString()});
      return promise.then((doc) => {
        this.doc = doc;
      });
    });

    before(function() {
      const database = Database.sharedInstance();
      const promise = database.save(collection, {attribute: global.randomString()});
      return promise.then((doc) => {
        this.doc2 = doc;
      });
    });

    after(function() {
      const query = new Query();
      query.contains('_id', [this.doc._id, this.doc2._id]);
      const database = Database.sharedInstance();
      return database.clean(collection, query);
    });

    after(function() {
      delete this.doc;
      delete this.doc2;
    });

    it('should return all documents', function() {
      const promise = this.database.find(collection).then((docs) => {
        expect(docs).to.be.an('array');
        expect(docs).to.have.length(2);

        const docIds = docs.map(function(doc) {
          return doc._id;
        });
        expect(docIds).to.contain(this.doc._id);
        expect(docIds).to.contain(this.doc2._id);
      });

      return promise;
    });

    it('should return all documents with fields filtered by query', function() {
      const query = new Query();
      query.fields(['_id']);

      const promise = this.database.find(collection, query).then(function(docs) {
        expect(docs).to.be.an('array');
        expect(docs).not.to.be.empty;

        docs.forEach(function(doc) {
          expect(doc).to.have.property('_id');
          expect(doc).not.to.have.property('attribute');
        });
      });

      return promise;
    });
  });
});
