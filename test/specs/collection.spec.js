const Collection = require('../../src/core/collections/collection');
const DataPolicy = require('../../src/core/enums').DataPolicy;
const Query = require('../../src/core/query');
const nock = require('nock');

describe('Collection', function() {
  before(function() {
    return loginUser();
  });

  before(function() {
    this.collection = new Collection('books');
    const book = { title: 'The Definitive Guide to JavaScript', author: 'David Flanagan' };
    const promise = this.collection.save(book, {
      dataPolicy: DataPolicy.LocalOnly
    });

    return promise.then(book => {
      this.book = book;
    });
  });

  describe('find()', function() {
    it('should respond', function() {
      expect(this.collection).itself.to.respondTo('find');
    });

    describe('DataPolicy.NetworkOnly', function() {
      it('should return all models in the collection when no query is provided', function() {
        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .reply(200, [{
            _id: '56462e112bd5548e4207a569',
            _kmd: {
              lmt: '2015-11-13T18:38:09.085Z',
              ect: '2015-11-13T18:38:09.085Z'
            },
            _acl: {
              creator: 'kid_byGoHmnX2'
            },
            title: 'Harry Potter'
          }], {
            'content-type': 'application/json'
          });

        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.CloudOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(1);
          return books;
        });
      });

      it('should return all models in the collection matching the provided query', function() {
        const query = new Query();
        query.equalTo('title', 'Harry Potter');

        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .query({
            query: JSON.stringify(query.toJSON().filter)
          })
          .reply(200, [{
            _id: '56462e112bd5548e4207a569',
            _kmd: {
              lmt: '2015-11-13T18:38:09.085Z',
              ect: '2015-11-13T18:38:09.085Z'
            },
            _acl: {
              creator: 'kid_byGoHmnX2'
            },
            title: 'Harry Potter'
          }], {
            'content-type': 'application/json'
          });

        const promise = this.collection.find(query, {
          dataPolicy: DataPolicy.CloudOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(1);
          return books;
        });
      });
    });

    describe('DataPolicy.LocalOnly', function() {
      it('should return all models in the collection when no query is provided', function() {
        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.LocalOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(1);
          return books;
        });
      });

      it('should return all models in the collection matching the provided query', function() {
        const query = new Query();
        query.equalTo('title', 'foo');

        const promise = this.collection.find(query, {
          dataPolicy: DataPolicy.LocalOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(0);
          return books;
        });
      });
    });
  });

  describe('get()', function() {
    it('should respond', function() {
      expect(this.collection).itself.to.respondTo('get');
    });

    describe('DataPolicy.CloundOnly', function() {
      it('should return the model for an existing id', function() {
        const id = '56462e112bd5548e4207a569';

        nock('https://baas.kinvey.com')
          .get(`/appdata/kid_byGoHmnX2/books/${id}`)
          .reply(200, {
            _id: '56462e112bd5548e4207a569',
            _kmd: {
              lmt: '2015-11-13T18:38:09.085Z',
              ect: '2015-11-13T18:38:09.085Z'
            },
            _acl: {
              creator: 'kid_byGoHmnX2'
            },
            title: 'Harry Potter'
          }, {
            'content-type': 'application/json'
          });

        const promise = this.collection.get(id, {
          dataPolicy: DataPolicy.CloudOnly
        });

        return promise.then(book => {
          expect(book._id).to.equal(id);
          return book;
        });
      });

      it('should throw a NotFoundError for a non-existent id', function() {
        const id = 'doesnotexist';

        nock('https://baas.kinvey.com')
          .get(`/appdata/kid_byGoHmnX2/books/${id}`)
          .reply(404, {
            error: 'EntityNotFound',
            description: 'This entity not found in the collection',
            debug: ''
          }, {
            'content-type': 'application/json; charset=utf-8',
            'content-length': '93'
          });

        const promise = this.collection.get(id, {
          dataPolicy: DataPolicy.CloudOnly
        });

        return promise.catch(err => {
          expect(err.message).to.equal('This entity not found in the collection');
        });
      });
    });

    describe('DataPolicy.LocalOnly', function() {
      it('should return the model for an existing id', function() {
        const id = this.book.id;
        const promise = this.collection.get(id, {
          dataPolicy: DataPolicy.LocalOnly
        });

        return promise.then(book => {
          expect(book.id).to.equal(id);
          return book;
        });
      });

      it('should throw a NotFoundError for a non-existent id', function() {
        const id = 'doesnotexist';
        const promise = this.collection.get(id, {
          dataPolicy: DataPolicy.LocalOnly
        });

        return promise.catch(err => {
          expect(err.message).to.equal(`Unable to find model with id = ${id}.`);
        });
      });
    });
  });

  describe('save()', function() {
    it('should respond', function() {
      expect(this.collection).itself.to.respondTo('save');
    });

    it('should create an id when saving a new model', function() {
      const book = { title: 'foo', author: 'bar' };
      const promise = this.collection.save(book, {
        dataPolicy: DataPolicy.LocalOnly
      });

      return promise.then(savedBook => {
        expect(savedBook._id).to.exist;
        return savedBook;
      });
    });
  });
});
