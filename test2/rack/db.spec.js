import '../setup';
import { DB, DBAdapter, Memory } from '../../src/rack/cache';
import { KinveyError, NotFoundError } from '../../src/errors';
import { randomString } from '../../src/utils/string';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const databaseName = 'testDatabase';
const collectionName = 'testCollection';

describe('DB', function() {
  before(function() {
    this.db = new DB(databaseName);
    return this.db.clear();
  });

  after(function() {
    return this.db.clear();
  });

  after(function() {
    delete this.db;
  });

  it('should throw an error if no name is provided', function() {
    expect(function() {
      const db = new DB();
      return db;
    }).to.throw(KinveyError);
  });

  it('should throw an error if name is not a string', function() {
    expect(function() {
      const db = new DB({});
      return db;
    }).to.throw(KinveyError);
  });

  it('should allow to specify a single adapter');
  it('should allow to specify an array of adapters');

  describe('find()', function() {
    before(function() {
      return this.db.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity = entity;
      });
    });

    after(function() {
      return this.db.removeById(collectionName, this.entity._id).then(() => {
        delete this.entity;
      });
    });

    before(function() {
      return this.db.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity2 = entity;
      });
    });

    after(function() {
      return this.db.removeById(collectionName, this.entity2._id).then(() => {
        delete this.entity2;
      });
    });

    it('should be a function', function() {
      expect(DB).to.respondTo('find');
    });

    it('should return an empty array if a collection does not contain eny entities', function() {
      return this.db.find('foo').then(entities => {
        expect(entities).to.be.an('array');
        expect(entities.length).to.equal(0);
      });
    });

    it('should return all entities in a collection', function() {
      return this.db.find(collectionName).then(entities => {
        expect(entities).to.be.an('array');
        expect(entities.length).to.equal(2);
      });
    });
  });

  describe('findById()', function() {
    before(function() {
      return this.db.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity = entity;
      });
    });

    after(function() {
      return this.db.removeById(collectionName, this.entity._id).then(() => {
        delete this.entity;
      });
    });

    before(function() {
      return this.db.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity2 = entity;
      });
    });

    after(function() {
      return this.db.removeById(collectionName, this.entity2._id).then(() => {
        delete this.entity2;
      });
    });

    it('should be a function', function() {
      expect(DB).to.respondTo('findById');
    });

    it('should throw a NotFoundError for an entity that does not exist', function() {
      return this.db.findById(collectionName, randomString()).then(entity => {
        expect(entity).to.be.null;
      }).catch(error => {
        expect(error).to.be.instanceof(NotFoundError);
      });
    });

    it('should return the entity when it exists', function() {
      const entity = {
        _id: randomString(),
        attribute: randomString()
      };
      return this.db.save(collectionName, entity).then(savedEntity => {
        return this.db.findById(collectionName, savedEntity._id);
      }).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.db.removeById(collectionName, savedEntity._id);
      });
    });
  });

  describe('save()', function() {
    it('should be a function', function() {
      expect(DB).to.respondTo('save');
    });

    it('should save one entity', function() {
      const entity = {
        _id: randomString(),
        attribute: randomString()
      };
      return this.db.save(collectionName, entity).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.db.findById(collectionName, savedEntity._id);
      }).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.db.removeById(collectionName, savedEntity._id);
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
      return this.db.save(collectionName, entities).then(savedEntities => {
        expect(savedEntities).to.deep.equal(entities);
        return this.db.find(collectionName);
      }).then(savedEntities => {
        expect(savedEntities).to.be.an('array');
        expect(savedEntities.length).to.equal(2);

        entities = keyBy(entities, '_id');
        savedEntities = keyBy(savedEntities, '_id');

        for (const id in savedEntities) {
          if (savedEntities.hasOwnProperty(id)) {
            expect(savedEntities[id]).to.deep.equal(entities[id]);
          }
        }

        const promises = map(Object.keys(savedEntities), id => {
          return this.db.removeById(collectionName, id);
        });

        return Promise.all(promises);
      });
    });
  });
});
