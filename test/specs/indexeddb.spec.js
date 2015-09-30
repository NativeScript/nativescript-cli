import IndexedDBAdapter from '../../src/core/cache/adapters/indexeddb';
import Query from '../../src/core/query';

describe('IndexedDBAdapter', function() {
  before(function() {
    this.dbInfo = {
      name: global.randomString(),
      collection: 'foo'
    };
    this.adapter = new IndexedDBAdapter(this.dbInfo);
  });

  after(function() {
    return this.adapter.clear();
  });

  beforeEach(function() {
    let docs = [];

    for (let i = 0; i < 2; i++) {
      docs.push({
        _id: global.randomString()
      });
    }

    docs = docs.sort((doc1, doc2) => {
      return doc1._id.localeCompare(doc2._id);
    });

    return this.adapter.batch(docs).then(docs => {
      this.docs = docs;
    });
  });

  afterEach(function() {
    return this.adapter.clean().then(() => {
      this.docs = [];
    });
  });

  describe('dbInfo', function() {
    it('should exist', function() {
      expect(this.adapter.dbInfo).to.exist;
      expect(this.adapter.dbInfo).to.equal(this.dbInfo);
    });
  });

  describe('queue', function() {
    it('should be an empty array', function() {
      expect(this.adapter.queue).to.exist;
      expect(this.adapter.queue).to.be.an.instanceOf(Array);
      expect(this.adapter.queue).to.deep.equal([]);
    });
  });

  describe('find()', function() {
    it('should return all the documents in the collection', function() {
      return this.adapter.find().then(storedDocs => {
        storedDocs = storedDocs.sort((doc1, doc2) => {
          return doc1._id.localeCompare(doc2._id);
        });

        expect(storedDocs.length).to.equal(this.docs.length);
        expect(storedDocs).to.deep.equal(this.docs);
        return storedDocs;
      });
    });

    it('should return the documents in the collection that match the provided query', function() {
      const doc = { _id: global.randomString(), title: 'foo' };
      return this.adapter.save(doc).then(() => {
        const query = new Query();
        query.equalTo('title', 'foo');
        return this.adapter.find(query);
      }).then(storedDocs => {
        expect(storedDocs.length).to.equal(1);
        expect(storedDocs).to.deep.equal([doc]);
        expect(storedDocs[0].title).to.equal('foo');
      });
    });
  });

  describe('count()', function() {
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
