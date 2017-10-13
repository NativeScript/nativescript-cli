/* eslint-env mocha */
/* eslint-disable consistent-return */

import { expect } from 'chai';
import { LocalStorageAdapter } from '../../../src/html5/middleware/storage/webstorage';
import { randomString } from '../../../src/core/utils';

describe('HTML5:LocalStorageAdapter', () => {
  let storageAdapter;

  before(() => {
    return LocalStorageAdapter.load(randomString())
      .then((adapter) => {
        storageAdapter = adapter;
      });
  });

  after(() => {
    if (storageAdapter) {
      return storageAdapter.clear();
    }
  });

  describe('find()', () => {
    it('should return an empty array', () => {
      if (storageAdapter) {
        const collection = randomString();
        return storageAdapter.find(collection)
          .then((storedData) => {
            expect(storedData).to.deep.equal([]);
          });
      }
    });

    it('should return array', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal(data);
          });
      }
    });
  });

  describe('findById()', () => {
    it('should return undefined if id does not exist', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.findById(collection, randomString());
          })
          .then((storedData) => {
            expect(storedData).to.equal(undefined);
          });
      }
    });

    it('should return data if id exists', () => {
      if (storageAdapter) {
        const collection = randomString();
        const id = randomString();
        const data = [{ _id: randomString() }, { _id: id }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.findById(collection, id);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal(data[1]);
          });
      }
    });
  });

  describe('save()', () => {
    it('should save data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([data]);
          });
      }
    });

    it('should save an array of data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal(data);
          });
      }
    });

    it('should overwrite saved data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString(), title: randomString(), count: randomString() };
        const updateData = { _id: data._id, title: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.save(collection, updateData);
          })
          .then(() => {
            return storageAdapter.findById(collection, updateData._id);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal(updateData);
          });
      }
    });

    it('should add data to existing data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = { _id: randomString() };
        const data2 = { _id: randomString(), title: randomString() };
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.save(collection, data2);
          })
          .then(() => {
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([data, data2]);
          });
      }
    });
  });

  describe('removeById()', () => {
    it('should return { count: 0 } if id does not exist', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.removeById(collection, randomString());
          })
          .then((result) => {
            expect(result).to.deep.equal({ count: 0 });
          });
      }
    });

    it('should return { count: 1 } if id exists', () => {
      if (storageAdapter) {
        const collection = randomString();
        const id = randomString();
        const data = [{ _id: randomString() }, { _id: id }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.removeById(collection, id);
          })
          .then((result) => {
            expect(result).to.deep.equal({ count: 1 });
            return storageAdapter.findById(collection, id);
          })
          .then((storedData) => {
            expect(storedData).to.equal(undefined);
          });
      }
    });
  });

  describe('clear()', () => {
    it('should clear all data', () => {
      if (storageAdapter) {
        const collection = randomString();
        const data = [{ _id: randomString() }, { _id: randomString() }];
        return storageAdapter.save(collection, data)
          .then(() => {
            return storageAdapter.clear();
          })
          .then((result) => {
            expect(result).to.equal(null);
            return storageAdapter.find(collection);
          })
          .then((storedData) => {
            expect(storedData).to.deep.equal([]);
          });
      }
    });
  });
});
