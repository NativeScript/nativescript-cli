import Store from '../../src/core/stores/store';
import Query from '../../src/core/query';
import { randomString, loginUser, logoutUser } from '../utils';
const collectionName = 'books';

describe('Store', function() {
  before(function() {
    return loginUser();
  });

  after(function() {
    return logoutUser();
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
      }).then(book => {
        this.book = book;
      });
    });

    after(function() {
      return this.store.remove(this.book._id);
    });

    after(function() {
      delete this.book;
    });

    before(function() {
      return this.store.save({
        attribute: randomString()
      }).then(book => {
        this.book2 = book;
      });
    });

    after(function() {
      return this.store.remove(this.book2._id);
    });

    after(function() {
      delete this.book2;
    });

    it('should respond', function() {
      expect(Store).to.respondTo('find');
    });

    it('should return all models when provide no query', function() {
      return this.store.find().then(books => {
        expect(books).to.be.an('array');
        expect(books).to.have.length(2);

        const bookIds = books.map(book => {
          return book._id;
        });
        expect(bookIds).to.contain(this.book._id);
        expect(bookIds).to.contain(this.book2._id);
      });
    });

    it('should be rejected when provided an invalid query', function() {
      return expect(this.store.find({})).to.be.rejected;
    });

    it('should return all models with field selection through a query', function() {
      const query = new Query();
      query.fields(['_id']);
      return this.store.find(query).then(books => {
        expect(books).to.be.an('array');
        expect(books).to.have.length(2);

        books.forEach(book => {
          expect(book).to.have.property('_id');
          expect(book).not.to.have.property('attribute');
        });
      });
    });

    it('should return all models matching a query with filter:attribute');
    it('should return all models matching a query with filter:nonExistingAttribute');
    it('should return all models sorted when a sort order is specified');
    it('should return 1 model with a limit of 1 specified');
    it('should return 1 model with a skip of 1 specified');
  });
});
