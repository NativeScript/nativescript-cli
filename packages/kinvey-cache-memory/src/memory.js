import sift from 'sift';
import isEmpty from 'lodash/isEmpty';
import isNumber from 'lodash/isNumber';

const store = {};

export function find(appKey, collectionName, query) {
  const collections = store[appKey] || {};
  let docs = collections[collectionName] || [];

  if (query) {
    const {
      filter,
      sort,
      fields,
      limit,
      skip
    } = query;

    // Filter
    docs = sift(filter, docs);

    // Sort
    if (!isEmpty(sort)) {
      docs.sort((a, b) => {
        for (const field in sort) {
          if (sort.hasOwnProperty(field)) {
            // Find field in objects.
            const aField = nested(a, field);
            const bField = nested(b, field);
            const modifier = sort[field]; // 1 (ascending) or -1 (descending).

            if (isDefined(aField) && isDefined(bField) === false) {
              return 1 * modifier;
            } else if (isDefined(aField) === false && isDefined(bField)) {
              return -1 * modifier;
            } else if (typeof aField === 'undefined' && bField === null) {
              return 0;
            } else if (aField === null && typeof bField === 'undefined') {
              return 0;
            } else if (aField !== bField) {
              return (aField < bField ? -1 : 1) * modifier;
            }
          }
        }

        return 0;
      });
    }

    // Remove fields
    if (Array.isArray(fields) && fields.length > 0) {
      const protectedFields = [].concat(fields, ['_id', '_acl']);
      docs = docs.map((doc) => {
        const keys = Object.keys(doc);
        keys.forEach((key) => {
          if (protectedFields.indexOf(key) === -1) {
            delete doc[key];
          }
        });

        return doc;
      });
    }

    // Limit and skip.
    if (isNumber(skip)) {
      if (isNumber(limit) && limit > 0) {
        docs = docs.slice(skip, skip + limit);
      } else {
        docs = docs.slice(skip);
      }
    }
  }

  return docs;
}

// export async function reduce(appKey, collectionName, aggregation) {
//   const db = await open(appKey, collectionName);
//   const collection = db.getCollection(collectionName);
//   return collection.reduce(aggregation);
// }

export function count(appKey, collectionName, query) {
  const docs = find(appKey, collectionName, query);
  return docs.length;
}

export function findById(appKey, collectionName, id) {
  const docs = find(appKey, collectionName);
  return docs.find(doc => doc._id === id);
}

export function save(appKey, collectionName, docsToInsertOrUpdate) {
  const collections = store[appKey] || {};
  const docs = collections[collectionName] || [];

  docsToInsertOrUpdate.forEach((docToInsertOrUpdate) => {
    const savedDocIndex = docs.findIndex(doc => doc._id === docToInsertOrUpdate._id);
    if (savedDocIndex !== -1) {
      docs[savedDocIndex] = docToInsertOrUpdate;
    } else {
      docs.push(docToInsertOrUpdate);
    }
  });

  collections[collectionName] = docs;
  store[appKey] = collections;
  return docs;
}

export function remove(appKey, collectionName, query) {
  const docsToRemove = find(appKey, collectionName, query);
  const collections = store[appKey] || {};
  const docs = collections[collectionName] || [];
  let count = 0;

  docsToRemove.forEach((docToRemove) => {
    const index = docs.findIndex(doc => doc._id === docToRemove._id);
    if (index !== -1) {
      docs.splice(index, 1);
      count += 1;
    }
  });

  collections[collectionName] = docs;
  store[appKey] = collections;
  return count;
}

export function removeById(appKey, collectionName, id) {
  const collections = store[appKey] || {};
  const docs = collections[collectionName] || [];
  const index = docs.findIndex(doc => doc._id === id);
  let count = 0;

  if (index !== -1) {
    docs.splice(index, 1);
    count += 1;
  }

  collections[collectionName] = docs;
  store[appKey] = collections;
  return count;
}

export function clear(appKey, collectionName) {
  const collections = store[appKey] || {};
  collections[collectionName] = [];
  store[appKey] = collections;
}

export function clearAll(appKey) {
  store[appKey] = {};
}
