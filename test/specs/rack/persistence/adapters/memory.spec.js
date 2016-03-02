import { Memory } from '../../../../../src/rack/persistence/adapters/memory';
import { KinveyError, NotFoundError } from '../../../../../src/errors';
import { randomString } from '../../../../helpers';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import chai from 'chai';
const expect = chai.expect;
const databaseName = 'testDatabase';
const collectionName = 'testCollection';

describe('Memory', function() {
  before(function() {
    this.memory = new Memory(databaseName);
  });

  after(function() {
    delete this.memory;
  });

  it('should throw an error if no name is provided', function() {
    expect(function() {
      const memory = new Memory();
      return memory;
    }).to.throw(KinveyError);
  });

  it('should throw an error if name is not a string', function() {
    expect(function() {
      const memory = new Memory({});
      return memory;
    }).to.throw(KinveyError);
  });

  it('should set name with constructor', function() {
    const name = 'foo';
    const memory = new Memory(name);
    expect(memory.name).to.equal(name);
  });

  describe('find()', function() {
    before(function() {
      return this.memory.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity = entity;
      });
    });

    after(function() {
      return this.memory.removeById(collectionName, this.entity._id).then(() => {
        delete this.entity;
      });
    });

    before(function() {
      return this.memory.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity2 = entity;
      });
    });

    after(function() {
      return this.memory.removeById(collectionName, this.entity2._id).then(() => {
        delete this.entity2;
      });
    });

    it('should be a function', function() {
      expect(Memory).to.respondTo('find');
    });

    it('should return an empty array if a collection does not contain eny entities', function() {
      return this.memory.find('foo').then(entities => {
        expect(entities).to.be.an('array');
        expect(entities.length).to.equal(0);
      });
    });

    it('should return all entities in a collection', function() {
      return this.memory.find(collectionName).then(entities => {
        expect(entities).to.be.an('array');
        expect(entities.length).to.equal(2);
      });
    });
  });

  describe('findById()', function() {
    before(function() {
      return this.memory.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity = entity;
      });
    });

    after(function() {
      return this.memory.removeById(collectionName, this.entity._id).then(() => {
        delete this.entity;
      });
    });

    before(function() {
      return this.memory.save(collectionName, {
        _id: randomString(),
        attribute: randomString()
      }).then(entity => {
        this.entity2 = entity;
      });
    });

    after(function() {
      return this.memory.removeById(collectionName, this.entity2._id).then(() => {
        delete this.entity2;
      });
    });

    it('should be a function', function() {
      expect(Memory).to.respondTo('findById');
    });

    it('should throw a NotFoundError for an entity that does not exist', function() {
      return this.memory.findById(collectionName, randomString()).then(entity => {
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
      return this.memory.save(collectionName, entity).then(savedEntity => {
        return this.memory.findById(collectionName, savedEntity._id);
      }).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.memory.removeById(collectionName, savedEntity._id);
      });
    });
  });

  describe('save()', function() {
    it('should be a function', function() {
      expect(Memory).to.respondTo('save');
    });

    it('should save one entity', function() {
      const entity = {
        _id: randomString(),
        attribute: randomString()
      };
      return this.memory.save(collectionName, entity).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.memory.findById(collectionName, savedEntity._id);
      }).then(savedEntity => {
        expect(savedEntity).to.deep.equal(entity);
        return this.memory.removeById(collectionName, savedEntity._id);
      });
    });

    it('should save an array of entities', function() {
      const entities = [
        {
          _id: randomString(),
          attribute: randomString()
        },
        {
          _id: randomString(),
          attribute: randomString()
        }
      ];
      return this.memory.save(collectionName, entities).then(savedEntities => {
        expect(savedEntities).to.deep.equal(entities);
        return this.memory.find(collectionName);
      }).then(savedEntities => {
        expect(savedEntities).to.be.an('array');
        expect(savedEntities.length).to.equal(2);
        expect(savedEntities).to.deep.equal(entities);
        const savedEntityIds = Object.keys(keyBy(savedEntities, '_id'));
        const promises = map(savedEntityIds, id => {
          return this.memory.removeById(collectionName, id);
        });
        return Promise.all(promises);
      });
    });
  });

  describe('isSupported()', function() {
    it('should be a static function', function() {
      expect(Memory).itself.to.respondTo('isSupported');
    });

    it('should return true', function() {
      expect(Memory.isSupported()).to.be.true;
    });
  });
});
