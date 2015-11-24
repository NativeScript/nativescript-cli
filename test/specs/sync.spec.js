const Collection = require('../../src/core/collections/collection');
const DataPolicy = require('../../src/core/enums').DataPolicy;
const Sync = require('../../src/core/sync');
const nock = require('nock');

describe('Sync', function() {
  before(function() {
    return loginUser();
  });

  before(function() {
    Sync.enable();
  });

  describe('enable()', function() {
    it('should enable sync', function() {
      Sync.enable();
      expect(Sync.isEnabled()).to.be.true;
    });
  });

  describe('disable()', function() {
    afterEach(function() {
      Sync.enable();
    });

    it('should disable sync', function() {
      Sync.disable();
      expect(Sync.isEnabled()).to.be.false;
    });
  });

  describe('isEnabled()', function() {
    afterEach(function() {
      Sync.enable();
    });

    it('should return true if enabled', function() {
      expect(Sync.isEnabled()).to.be.true;
    });

    it('should return false if disabled', function() {
      Sync.disable();
      expect(Sync.isEnabled()).to.be.false;
    });
  });

  describe('count()', function() {
    describe('with documents pending sychronization', function() {
      before(function() {
        this.books = new Collection('books', {
          dataPolicy: DataPolicy.LocalOnly
        });
        return this.books.save({
          title: 'foo'
        }).then(book => {
          this.book = book;
        });
      });

      after(function() {
        return this.books.delete(this.book.id);
      });

      after(function() {
        delete this.books;
        delete this.book;
      });

      after(function() {
        return Sync.clean();
      });

      it('should return 1', function() {
        const promise = Sync.count();
        return expect(promise).to.become(1);
      });
    });

    describe('with no documents pending sychronization', function() {
      it('should return 0', function() {
        const promise = Sync.count();
        return expect(promise).to.become(0);
      });
    });
  });

  describe('push()', function() {
    describe('with no documents pending sychronization', function() {
      it('should return immediately', function() {
        const promise = Sync.push();
        return expect(promise).to.become([]);
      });
    });

    describe('with documents pending sychronization', function() {
      describe('without conflicts', function() {
        beforeEach(function() {
          this.books = new Collection('books', {
            dataPolicy: DataPolicy.LocalOnly
          });
          return this.books.save({
            title: 'foo'
          }).then(book => {
            this.book = book;
          });
        });

        afterEach(function() {
          return this.books.delete(this.book.id);
        });

        afterEach(function() {
          delete this.books;
          delete this.book;
        });

        it('should sychronize a document', function() {
          const reply = {
            _id: '56462e112bd5548e4207a569',
            _kmd: {
              lmt: '2015-11-13T18:38:09.085Z',
              ect: '2015-11-13T18:38:09.085Z'
            },
            _acl: {
              creator: 'kid_byGoHmnX2'
            },
            title: 'foo'
          };

          nock('https://baas.kinvey.com')
            .post('/appdata/kid_byGoHmnX2/books')
            .reply(200, reply, {
              'content-type': 'application/json'
            });

          const promise = Sync.push();
          return promise.then(response => {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(this.books.name);
            expect(response[0].success).to.be.an('array');
            expect(response[0].success).to.have.length(1);
            expect(response[0].error).to.be.an('array');
            expect(response[0].error).to.be.empty;

            // Update the reference
            this.book = response[0].success[0].model;
          });
        });

        it('should save the document remotely', function() {
          const reply = {
            _id: '56462e112bd5548e4207a569',
            _kmd: {
              lmt: '2015-11-13T18:38:09.085Z',
              ect: '2015-11-13T18:38:09.085Z'
            },
            _acl: {
              creator: 'kid_byGoHmnX2'
            },
            title: 'foo'
          };

          nock('https://baas.kinvey.com')
            .post('/appdata/kid_byGoHmnX2/books')
            .reply(200, reply, {
              'content-type': 'application/json'
            });

          const promise = Sync.push();
          return promise.then(response => {
            const id = response[0].success[0]._id;
            return this.books.get(id);
          }).then(book => {
            expect(book).to.have.property('_id', reply._id);
            expect(book.kmd).to.have.property('lmt');

            // Update the reference
            this.book = book;
          });
        });
      });

      describe('with conflicts', function() {
        beforeEach(function() {
          this.books = new Collection('books', {
            dataPolicy: DataPolicy.LocalOnly
          });
          return this.books.save({
            title: 'foo'
          }).then(book => {
            this.book = book;
          });
        });

        afterEach(function() {
          return this.books.delete(this.book.id);
        });

        afterEach(function() {
          delete this.books;
          delete this.book;
        });

        it('should not synchronize the document');

        it('should not save the document remotely');

        it('should not update the document locally');

        it('should synchronize (update) the document if provided a conflict resolution');

        it('should not synchronize if the provided conflict resolution reject');
      });
    });
  });

  describe('sync()', function() {

  });
});
