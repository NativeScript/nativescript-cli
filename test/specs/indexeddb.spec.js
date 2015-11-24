import IndexedDB from '../../src/core/persistence/indexeddb';
import Query from '../../src/core/query';
const collection = 'books';

describe('IndexedDB', function() {
  before(function() {
    this.db = new IndexedDB(global.randomString());
  });

  after(function() {
    return this.db.destroy();
  });

  beforeEach(function() {
    let documents = [];

    for (let i = 0; i < 2; i++) {
      documents.push({
        _id: global.randomString()
      });
    }

    documents = documents.sort((document1, document2) => {
      return document1._id.localeCompare(document2._id);
    });

    return this.db.saveBulk(collection, documents).then(documents => {
      this.documents = documents;
    });
  });

  afterEach(function() {
    return this.db.removeWhere(collection).then(() => {
      this.documents = [];
      delete this.documents;
    });
  });

  describe('find()', function() {
    it('should return all the documents in the collection', function() {
      return this.db.find(collection).then(documents => {
        documents = documents.sort((document1, document2) => {
          return document1._id.localeCompare(document2._id);
        });

        expect(documents.length).to.equal(this.documents.length);
        expect(documents).to.deep.equal(this.documents);
        return documents;
      });
    });

    it('should return the documents in the collection that match the provided query', function() {
      const document = {
        title: 'foo'
      };

      return this.db.save(collection, document).then(() => {
        const query = new Query();
        query.equalTo('title', 'foo');
        return this.db.find(collection, query);
      }).then(documents => {
        expect(documents.length).to.equal(1);
        expect(documents).to.deep.equal([document]);
        expect(documents[0].title).to.equal(document.title);
      });
    });
  });

  describe('get()', function() {
    it('should return the count of all the documents in the collection', function() {
      return this.adapter.count().then(count => {
        expect(count).to.equal(this.docs.length);
      });
    });

    it('should return the count of the documents in the collection that match the provided query', function() {
      const doc = { _id: global.randomString(), title: 'foo' };
      return this.adapter.save(doc).then(() => {
        const query = new Query();
        query.equalTo('title', 'foo');
        return this.adapter.count(query);
      }).then(count => {
        expect(count).to.equal(1);
      });
    });
  });

  describe('get()', function() {
    it('should return the document in the collection for the id', function() {
      return this.adapter.get(this.docs[0]._id).then(doc => {
        expect(doc).to.deep.equal(this.docs[0]);
      });
    });
  });
});
