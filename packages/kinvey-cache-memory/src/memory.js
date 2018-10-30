const store = {};

export async function find(appKey, collectionName) {
  const collections = store[appKey] || {};
  return collections[collectionName] || [];
}

export async function count(appKey, collectionName) {
  const docs = await find(appKey, collectionName);
  return docs.length;
}

export async function findById(appKey, collectionName, id) {
  const docs = await find(appKey, collectionName);
  return docs.find(doc => doc._id === id);
}

export async function save(appKey, collectionName, docsToSave) {
  const collections = store[appKey] || {};
  const docs = collections[collectionName] || [];

  docsToSave.forEach((docToSave) => {
    const savedDocIndex = docs.findIndex(doc => doc._id === docToSave._id);
    if (savedDocIndex !== -1) {
      docs[savedDocIndex] = docToSave;
    } else {
      docs.push(docToSave);
    }
  });

  collections[collectionName] = docs;
  store[appKey] = collections;
  return docsToSave;
}

export async function removeById(appKey, collectionName, id) {
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

export async function clear(appKey, collectionName) {
  const collections = store[appKey] || {};
  collections[collectionName] = [];
  store[appKey] = collections;
  return true;
}

export async function clearAll(appKey) {
  store[appKey] = {};
  return true;
}
