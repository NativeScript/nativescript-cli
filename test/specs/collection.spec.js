const Collection = require('../../src/core/collections/collection');
const DataPolicy = require('../../src/core/enums').DataPolicy;
const nock = require('nock');

describe('Collection', function() {
  before(function() {
    return loginUser();
  });

  before(function() {
    this.collection = new Collection('books');
    const book = { title: 'The Definitive Guide to JavaScript', author: 'David Flanagan' };
    return this.collection.save(book, {
      dataPolicy: DataPolicy.LocalOnly
    }).then(book => {
      this.book = book;
    });
  });

  after(function() {
    return this.collection.clean(null, {
      dataPolicy: DataPolicy.LocalOnly
    }).then(() => {
      delete this.collection;
      delete this.book;
    });
  });

  describe('find()', function() {
    it('should respond', function() {
      expect(this.collection).itself.to.respondTo('find');
    });

    describe('DataPolicy.NetworkOnly', function() {
      it('should return all models from the network store', function() {
        const reply = [{
          _id: '56462e112bd5548e4207a569',
          _kmd: {
            lmt: '2015-11-13T18:38:09.085Z',
            ect: '2015-11-13T18:38:09.085Z'
          },
          _acl: {
            creator: 'kid_byGoHmnX2'
          },
          title: 'Harry Potter'
        }];

        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.NetworkOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(reply.length);
          return books;
        });
      });
    });

    describe('DataPolicy.NetworkFirst', function() {
      it('should return all models from the network store', function() {
        const reply = [{
          _id: '56462e112bd5548e4207a569',
          _kmd: {
            lmt: '2015-11-13T18:38:09.085Z',
            ect: '2015-11-13T18:38:09.085Z'
          },
          _acl: {
            creator: 'kid_byGoHmnX2'
          },
          title: 'Harry Potter'
        }];

        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.NetworkFirst
        });

        return promise.then(books => {
          expect(books.length).to.equal(reply.length);
          return books;
        });
      });

      it('should return all models from the local store when the network responds with an error', function() {
        const reply = {
          error: 'ServerError',
          description: 'A server error has occurred.',
          debug: ''
        };

        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .reply(500, reply, {
            'content-type': 'application/json'
          });

        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.NetworkFirst
        });

        return promise.then(books => {
          expect(books.length).to.equal(2);
          return books;
        });
      });
    });

    describe('DataPolicy.LocalOnly', function() {
      it('should return all models from the local store', function() {
        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.LocalOnly
        });

        return promise.then(books => {
          expect(books.length).to.equal(2);
          return books;
        });
      });
    });

    describe('DataPolicy.LocalFirst', function() {
      it('should return all models from the local store', function() {
        const promise = this.collection.find(null, {
          dataPolicy: DataPolicy.LocalFirst
        });

        return promise.then(books => {
          expect(books.length).to.equal(2);
          return books;
        });
      });
    });
  });

  describe('get()', function() {
    it('should respond', function() {
      expect(this.collection).itself.to.respondTo('get');
    });

    describe('DataPolicy.NetworkOnly', function() {
      it('should return the model for an existing id', function() {
        const reply = {
          _id: '56462e112bd5548e4207a569',
          _kmd: {
            lmt: '2015-11-13T18:38:09.085Z',
            ect: '2015-11-13T18:38:09.085Z'
          },
          _acl: {
            creator: 'kid_byGoHmnX2'
          },
          title: 'Harry Potter'
        };

        nock('https://baas.kinvey.com')
          .get(`/appdata/kid_byGoHmnX2/books/${reply._id}`)
          .reply(200, reply, {
            'content-type': 'application/json'
          });

        const promise = this.collection.get(reply._id, {
          dataPolicy: DataPolicy.NetworkOnly
        });

        return promise.then(book => {
          expect(book.id).to.equal(reply._id);
          expect(book._id).to.equal(reply._id);
          return book;
        });
      });

      it('should throw a NotFoundError for a non-existent id', function() {
        const id = 'doesnotexist';
        const reply = {
          error: 'EntityNotFound',
          description: 'This entity not found in the collection',
          debug: ''
        };

        nock('https://baas.kinvey.com')
          .get(`/appdata/kid_byGoHmnX2/books/${id}`)
          .reply(404, reply, {
            'content-type': 'application/json; charset=utf-8',
            'content-length': '93'
          });

        const promise = this.collection.get(id, {
          dataPolicy: DataPolicy.NetworkOnly
        });

        return promise.catch(err => {
          expect(err.message).to.equal(reply.description);
          expect(err.debug).to.equal(reply.debug);
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

      return promise.then(book => {
        expect(book._id).to.exist;
        expect(book.id).to.exist;
        return book;
      });
    });
  });
});
