import Database from '../../src/core/database';
import Query from '../../src/core/query';
const collection = 'posts';

describe('Database', function() {
  beforeEach(function() {
    this.database = new Database();
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
      const database = new Database();
      const promise = database.save(collection, {attribute: global.randomString()});
      return promise.then((doc) => {
        this.doc = doc;
      });
    });

    it('should return all documents, with field selection through a query', function() {
      const query = new Query();
      query.fields(['_id']);
      const promise = this.database.fetch(collection, query).then(function(docs) {
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
