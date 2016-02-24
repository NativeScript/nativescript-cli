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
    describe('with no documents pending sychronization', function() {
      it('should return 0', function() {
        const promise = Sync.count();
        return expect(promise).to.become(0);
      });
    });

    describe('with documents pending sychronization', function() {
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

      after(function() {
        return Sync.clear();
      });

      it('should return 1', function() {
        return expect(Sync.count()).to.become(1);
      });
    });
  });

  describe('push()', function() {
    describe('with no documents pending sychronization', function() {
      it('should return immediately', function() {
        return expect(Sync.push()).to.become([]);
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

        after(function() {
          return Sync.clear();
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

        it('should save a document remotely', function() {
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

        after(function() {
          return Sync.clear();
        });

        it('should not synchronize the document');
        it('should not save the document to the network');
        it('should not update the document locally');
        it('should synchronize (update) the document if provided a conflict resolution');
        it('should not synchronize if the provided conflict resolution reject');
      });
    });
  });

  describe('sync()', function() {
    // describe('with no documents pending sychronization', function() {
    //   beforeEach(function() {
    //     this.books = new Collection('books', {
    //       dataPolicy: DataPolicy.LocalOnly
    //     });
    //     return this.books.save({
    //       title: 'foo'
    //     }).then(book => {
    //       this.book = book;
    //       //return this.books.clearSync();
    //     });
    //   });
    //
    //   afterEach(function() {
    //     return this.books.delete(this.book.id);
    //   });
    //
    //   afterEach(function() {
    //     delete this.books;
    //     delete this.book;
    //   });
    //
    //   after(function() {
    //     return Sync.clear();
    //   });
    //
    //   it('should just fetch documents from the network', function() {
    //     const reply = [{
    //       _id: '56462e112bd5548e4207a569',
    //       _kmd: {
    //         lmt: '2015-11-13T18:38:09.085Z',
    //         ect: '2015-11-13T18:38:09.085Z'
    //       },
    //       _acl: {
    //         creator: 'kid_byGoHmnX2'
    //       },
    //       title: 'foo'
    //     }, {
    //       _id: '56462e112bd5548e4207a568',
    //       _kmd: {
    //         lmt: '2015-11-13T18:38:09.085Z',
    //         ect: '2015-11-13T18:38:09.085Z'
    //       },
    //       _acl: {
    //         creator: 'kid_byGoHmnX2'
    //       },
    //       title: 'bar'
    //     }];
    //
    //     nock('https://baas.kinvey.com')
    //       .get('/appdata/kid_byGoHmnX2/books')
    //       .reply(200, reply, {
    //         'content-type': 'application/json'
    //       });
    //
    //     const promise = Sync.sync();
    //     return promise.then(response => {
    //       console.log(response);
    //       expect(response).to.be.an('array');
    //       expect(response[0]).to.contain.keys(['push', 'sync']);
    //       expect(response[0].sync.collection).to.equal('books');
    //       expect(response[0].sync.models).to.be.an('array').and.to.have.length(reply.length);
    //       expect(response[0].sync.models[0].toJSON()).to.deep.equal(reply[0]);
    //       expect(response[0].sync.models[1].toJSON()).to.deep.equal(reply[1]);
    //     });
    //   });
    // });

    describe('with documents pending sychronization', function() {
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

      after(function() {
        return Sync.clear();
      });

      it('should synchronize the pending documents and fetch documents from the network', function() {
        const postReply = {
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
          .reply(200, postReply, {
            'content-type': 'application/json'
          });

        const getReply = [{
          _id: '56462e112bd5548e4207a569',
          _kmd: {
            lmt: '2015-11-13T18:38:09.085Z',
            ect: '2015-11-13T18:38:09.085Z'
          },
          _acl: {
            creator: 'kid_byGoHmnX2'
          },
          title: 'foo2'
        }, {
          _id: '56462e112bd5548e4207a568',
          _kmd: {
            lmt: '2015-11-13T18:38:09.085Z',
            ect: '2015-11-13T18:38:09.085Z'
          },
          _acl: {
            creator: 'kid_byGoHmnX2'
          },
          title: 'bar'
        }];

        nock('https://baas.kinvey.com')
          .get('/appdata/kid_byGoHmnX2/books')
          .reply(200, getReply, {
            'content-type': 'application/json'
          });

        const promise = Sync.sync();
        return promise.then(response => {
          expect(response).to.be.an('array');
          expect(response[0]).to.contain.keys(['push', 'sync']);
          expect(response[0].sync.collection).to.equal('books');
          expect(response[0].sync.models).to.be.an('array').and.to.have.length(getReply.length);
          expect(response[0].sync.models[0].toJSON()).to.deep.equal(getReply[0]);
          this.book = response[0].sync.models[0];
          expect(response[0].sync.models[1].toJSON()).to.deep.equal(getReply[1]);

          return Sync.count().then(count => {
            expect(count).to.equal(0);
            return this.books.count();
          }).then(count => {
            expect(count).to.equal(getReply.length);
          });
        });
      });
    });
  });
});
