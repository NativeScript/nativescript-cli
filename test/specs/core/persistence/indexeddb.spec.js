import IndexedDB from '../../../../src/core/persistence/indexeddb';
import { KinveyError, NotFoundError } from '../../../../src/core/errors';
import { randomString } from '../../../helper';
import chai from 'chai';
const expect = chai.expect;
const dbName = 'tests';
const collection = 'test-collection';

describe('IndexedDB', function() {
  // describe('openTransaction()', function() {
  //   beforeEach(function() {
  //     this.indexedDB = new IndexedDB(dbName);
  //   });

  //   afterEach(function() {
  //     return this.indexedDB.destroy();
  //   });

  //   afterEach(function() {
  //     delete this.indexedDB;
  //   });

  //   it('should return an error when a collection does not exist and write is false', function(done) {
  //     this.indexedDB.openTransaction(collection, false, transaction => {
  //       expect(transaction).to.be.undefined;
  //     }, error => {
  //       expect(error).to.be.instanceof(NotFoundError);
  //       expect(error.message).to.equal(`The ${collection} collection was not found on ` +
  //         `the ${this.indexedDB.dbName} indexedDB database.`);
  //       done();
  //     });
  //   });

  //   it('should return a transaction when a collection does not exist and write is true', function(done) {
  //     this.indexedDB.openTransaction(collection, true, transaction => {
  //       expect(transaction).to.not.be.undefined;
  //       done();
  //     }, error => {
  //       expect(error).to.be.undefined;
  //     });
  //   });
  // });

  describe('find()', function() {
    before(function() {
      this.indexedDB = new IndexedDB(dbName);
    });

    after(function() {
      return this.indexedDB.destroy();
    });

    after(function() {
      delete this.indexedDB;
    });

    // it('should reject when a collection is not provided', function() {
    //   return this.indexedDB.find().then(entities => {
    //     expect(entities).to.be.undefined;
    //   }).catch(error => {
    //     expect(error).to.be.instanceof(KinveyError);
    //     expect(error.message).to.equal('A collection was not provided.');
    //   });
    // });

    // it('should return an empty array when the collection does not exist', function() {
    //   return this.indexedDB.find(collection).then(entities => {
    //     expect(entities).to.be.an('array');
    //     expect(entities).to.have.length(0);
    //   }).catch(error => {
    //     expect(error).to.be.undefined;
    //   });
    // });

    it('should return the entities for the collection', function() {
      const entity = { attribute: randomString() };
      return this.indexedDB.save(collection, entity).then(() => {
        return this.indexedDB.find(collection);
      }).then(entities => {
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities[1]).to.deep.equal(entity);
      }).catch(error => {
        expect(error).to.be.undefined;
      });

      // return this.indexedDB.save(collection, entity).then(entity => {
      //   console.log(entity);
      // }).catch(error => {
      //   console.log(error);
      // });
    });
  });
});
