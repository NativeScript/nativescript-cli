import Loki from 'lokijs';
import isEmpty from 'lodash/isEmpty';

class Collection extends Loki.Collection {
  find(query, chain = false) {
    let resultSet = this.chain();

    if (!query) {
      return resultSet;
    }

    const {
      filter,
      sort,
      limit,
      skip
    } = query;
    let { fields } = query;

    // Filter
    resultSet = resultSet.find(filter);

    // Sort
    if (!isEmpty(sort)) {
      let compoundSort = [];

      Object.keys(sort).forEach((field) => {
        const modifier = sort[field]; // 1 (ascending) or -1 (descending)

        if (modifier === -1) {
          compoundSort = compoundSort.concat([[field, true]]);
        } else if (modifier === 1) {
          compoundSort = compoundSort.concat([field]);
        }
      });

      resultSet = resultSet.compoundsort(compoundSort);
    }

    // Skip
    if (typeof skip === 'number') {
      resultSet = resultSet.offset(skip);
    }

    // Limit
    if (typeof limit === 'number') {
      resultSet = resultSet.limit(limit);
    }

    // Remove fields
    if (Array.isArray(fields) && fields.length > 0) {
      fields = [].concat(fields, ['_id', '_acl']);
      resultSet = resultSet.map((doc) => {
        const keys = Object.keys(doc);
        keys.forEach((key) => {
          if (fields.indexOf(key) === -1) {
            // eslint-disable-next-line no-param-reassign
            delete doc[key];
          }
        });
        return doc;
      });
    }

    if (chain) {
      return resultSet;
    }

    return resultSet.data({ removeMeta: true });
  }

  reduce(aggregation) {
    const {
      query,
      initial,
      fields,
      reduceFn
    } = aggregation;
    let docs = [];

    if (query) {
      docs = this.find(query);
    } else {
      docs = this.chain().data({ removeMeta: true });
    }

    if (fields.length > 0) {
      return fields.reduce((results, field) => {
        // eslint-disable-next-line no-param-reassign
        results[field] = docs.reduce((result, doc) => reduceFn(result, doc, field) || result, initial);
        return results;
      }, {});
    }

    return docs.reduce((result, doc) => reduceFn(doc, result) || result, Object.assign({}, initial));
  }
}

class Memory extends Loki {
  addCollection(collectionName, options = {}) {
    if (options.disableMeta === true) {
      if (options.disableChangesApi === false) {
        throw new Error('disableMeta option cannot be passed as true when disableChangesApi is passed as false');
      }
      if (options.disableDeltaChangesApi === false) {
        throw new Error('disableMeta option cannot be passed as true when disableDeltaChangesApi is passed as false');
      }
      if (typeof options.ttl === 'number' && options.ttl > 0) {
        throw new Error('disableMeta option cannot be passed as true when ttl is enabled');
      }
    }

    for (let i = 0, len = this.collections.length; i < len; i += 1) {
      if (this.collections[i].name === collectionName) {
        return this.collections[i];
      }
    }

    const collection = new Collection(collectionName, options);
    this.collections.push(collection);

    if (this.verbose) {
      collection.console = console;
    }

    return collection;
  }
}

function open(dbName, collectionName) {
  return new Promise((resolve, reject) => {
    const db = new Memory(dbName, {
      autosave: false,
      autoload: true,
      autoloadCallback: (error) => {
        if (error) {
          reject(error);
        } else {
          if (collectionName) {
            let collection = db.getCollection(collectionName);

            if (!collection) {
              collection = db.addCollection(collectionName, {
                clone: true,
                unique: ['_id'],
                disableMeta: true
              });
            }
          }

          resolve(db);
        }
      }
    });
  });
}

export async function find(appKey, collectionName, query) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  return collection.find(query);
}

export async function reduce(appKey, collectionName, aggregation) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  return collection.reduce(aggregation);
}

export async function count(appKey, collectionName, query) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  const resultSet = collection.find(query, true);
  return resultSet.count();
}

export async function findById(appKey, collectionName, id) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  const doc = collection.by('_id', id);

  if (doc) {
    delete doc.$loki;
  }

  return doc;
}

export async function save(appKey, collectionName, docsToSaveOrUpdate) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  let docs = docsToSaveOrUpdate;

  if (!docs) {
    return null;
  }

  docs = docs.map((doc) => {
    let savedDoc = collection.by('_id', doc._id);

    if (savedDoc) {
      savedDoc = Object.assign({}, savedDoc, doc);
      collection.update(savedDoc);
      return savedDoc;
    }

    collection.insert(doc);
    return doc;
  });

  return new Promise((resolve, reject) => {
    db.save((error) => {
      if (error) {
        return reject(error);
      }

      return resolve(docs);
    });
  });
}

export async function remove(appKey, collectionName, query) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  const resultSet = collection.find(query, true);
  const count = resultSet.count();

  if (count > 0) {
    resultSet.remove();

    return new Promise((resolve, reject) => {
      db.save((error) => {
        if (error) {
          return reject(error);
        }

        return resolve(count);
      });
    });
  }

  return 0;
}

export async function removeById(appKey, collectionName, id) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  const doc = collection.by('_id', id);

  if (doc) {
    const removedDoc = collection.remove(doc);

    if (removedDoc) {
      return new Promise((resolve, reject) => {
        db.save((error) => {
          if (error) {
            return reject(error);
          }

          return resolve(1);
        });
      });
    }
  }

  return 0;
}

export async function clear(appKey, collectionName) {
  const db = await open(appKey, collectionName);
  const collection = db.getCollection(collectionName);
  collection.clear();

  return new Promise((resolve, reject) => {
    db.save((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

export async function clearAll(appKey) {
  const db = await open(appKey, 'book');
  return new Promise((resolve, reject) => {
    db.deleteDatabase((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

