import DataStore from '../../src/core/collections/datastore';
import DataPolicy from '../../src/core/enums/dataPolicy';
import Query from '../../src/core/query';

describe('DataStore', function() {
  before(function() {
    this.datastore = new DataStore('books');
    const book = { name: 'The Definitive Guide to JavaScript', author: 'David Flanagan' };
    const promise = this.datastore.save(book, {
      dataPolicy: DataPolicy.LocalOnly
    });

    return promise.then(book => {
      this.book = book;
    });
  });

  describe('save()', function() {
    it('should respond', function() {
      expect(this.datastore).itself.to.respondTo('save');
    });

    it('should create an _id when saving a new entity', function() {
      const book = { name: 'foo', author: 'bar' };
      const promise = this.datastore.save(book, {
        dataPolicy: DataPolicy.LocalOnly
      });

      return promise.then(savedBook => {
        expect(savedBook._id).to.exist;
        expect(savedBook.name).to.equal(book.name);
        expect(savedBook.author).to.equal(book.author);

        const query = new Query();
        query.equalTo('_id', savedBook._id);
        return this.datastore.find(query, {
          dataPolicy: DataPolicy.LocalOnly
        });
      }).then(books => {
        expect(books.length).to.equal(1);
      });
    });
  });
});
