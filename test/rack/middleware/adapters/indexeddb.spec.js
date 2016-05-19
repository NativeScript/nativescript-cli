/* eslint-disable no-underscore-dangle */
import '../../../setup';
import IndexedDB from '../../../../src/rack/middleware/adapters/indexeddb';
import { KinveyError } from '../../../../src/errors';
import { randomString } from '../../../../src/utils/string';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const database = 'tester';
const collection = 'tests';

if (IndexedDB.isSupported()) {
  describe('IndexedDB', function() {
    before(function() {
      this.db = new IndexedDB(database);
    });

    after(function() {
      delete this.db;
      delete global.indexedDB;
    });

    it('should throw an error if no name is provided', function() {
      expect(function() {
        const db = new IndexedDB();
        return db;
      }).to.throw(KinveyError);
    });

    it('should throw an error if name is not a string', function() {
      expect(function() {
        const db = new IndexedDB({});
        return db;
      }).to.throw(KinveyError);
    });

    it('should set name with constructor', function() {
      const db = new IndexedDB(database);
      expect(db.name).to.equal(database);
    });

    describe('find()', function() {
      before(function() {
        return this.db.save(collection, {
          _id: randomString(),
          attribute: randomString()
        }).then(entity => {
          this.entity = entity;
        });
      });

      after(function() {
        return this.db.removeById(collection, this.entity._id).then(() => {
          delete this.entity;
        });
      });

      before(function() {
        return this.db.save(collection, {
          _id: randomString(),
          attribute: randomString()
        }).then(entity => {
          this.entity2 = entity;
        });
      });

      after(function() {
        return this.db.removeById(collection, this.entity2._id).then(() => {
          delete this.entity2;
        });
      });

      it('should be a function', function() {
        expect(IndexedDB).to.respondTo('find');
      });

      it('should throw an error if a collection does not exist', function() {
        const promise = this.db.find('foo');
        return expect(promise).to.be.eventually.rejected;
      });

      it('should return all entities in a collection', function() {
        return this.db.find(collection).then(entities => {
          expect(entities).to.be.an('array');
          expect(entities.length).to.equal(2);
        });
      });
    });

    describe('findById()', function() {
      before(function() {
        return this.db.save(collection, {
          _id: randomString(),
          attribute: randomString()
        }).then(entity => {
          this.entity = entity;
        });
      });

      after(function() {
        return this.db.removeById(collection, this.entity._id).then(() => {
          delete this.entity;
        });
      });

      before(function() {
        return this.db.save(collection, {
          _id: randomString(),
          attribute: randomString()
        }).then(entity => {
          this.entity2 = entity;
        });
      });

      after(function() {
        return this.db.removeById(collection, this.entity2._id).then(() => {
          delete this.entity2;
        });
      });

      it('should be a function', function() {
        expect(IndexedDB).to.respondTo('findById');
      });

      it('should throw a NotFoundError for an entity that does not exist', function() {
        return this.db.findById(collection, randomString()).then(entity => {
          expect(entity).to.be.undefined;
        });
      });

      it('should return the entity when it exists', function() {
        const entity = {
          _id: randomString(),
          attribute: randomString()
        };
        return this.db.save(collection, entity)
          .then(savedEntity => this.db.findById(collection, savedEntity._id))
          .then(savedEntity => {
            expect(savedEntity).to.deep.equal(entity);
            return this.db.removeById(collection, savedEntity._id);
          });
      });
    });

    describe('save()', function() {
      it('should be a function', function() {
        expect(IndexedDB).to.respondTo('save');
      });

      it('should save one entity', function() {
        const entity = {
          _id: randomString(),
          attribute: randomString()
        };
        return this.db.save(collection, entity).then(savedEntity => {
          expect(savedEntity).to.deep.equal(entity);
          return this.db.findById(collection, savedEntity._id);
        }).then(savedEntity => {
          expect(savedEntity).to.deep.equal(entity);
          return this.db.removeById(collection, savedEntity._id);
        });
      });

      it('should save an array of entities', function() {
        let entities = [
          {
            _id: randomString(),
            attribute: randomString()
          },
          {
            _id: randomString(),
            attribute: randomString()
          }
        ];
        return this.db.save(collection, entities).then(savedEntities => {
          expect(savedEntities).to.deep.equal(entities);
          return this.db.find(collection);
        }).then(savedEntities => {
          expect(savedEntities).to.be.an('array');
          expect(savedEntities.length).to.equal(2);

          entities = keyBy(entities, '_id');
          savedEntities = keyBy(savedEntities, '_id');
          const ids = Object.keys(savedEntities);

          for (const id of ids) {
            expect(savedEntities[id]).to.deep.equal(entities[id]);
          }

          const promises = map(Object.keys(savedEntities), id => this.db.removeById(collection, id));
          return Promise.all(promises);
        });
      });
    });

    describe('removeById()', function() {
      it('should be a function', function() {
        expect(IndexedDB).to.respondTo('removeById');
      });

      it('should return undefined when an entity does not exist', function() {
        return this.db.removeById(collection, randomString()).then(entity => {
          expect(entity).to.be.undefined;
        });
      });

      it('should remove an entity and return the entity', function() {
        const entity = {
          _id: randomString(),
          attribute: randomString()
        };
        return this.db.save(collection, entity)
          .then(savedEntity => {
            expect(savedEntity).to.deep.equal(entity);
            return this.db.removeById(collection, savedEntity._id);
          })
          .then(savedEntity => {
            expect(savedEntity).to.deep.equal(entity);
            return this.db.findById(collection, savedEntity._id);
          })
          .then(entity => expect(entity).to.be.undefined);
      });
    });

    describe('isSupported()', function() {
      it('should be a static function', function() {
        expect(IndexedDB).itself.to.respondTo('isSupported');
      });

      it('should return a boolean', function() {
        expect(IndexedDB.isSupported()).to.be.true;
      });
    });
  });
}
