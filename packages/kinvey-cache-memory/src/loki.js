import Loki from 'lokijs';

const memAdapter = new Loki.LokiMemoryAdapter();

function open(dbName, collectionName) {
  return new Promise((resolve, reject) => {
    const db = new Loki(dbName, {
      adapter: memAdapter,
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

export async function find(dbName, collectionName) {
  const db = await open(dbName, collectionName);
  const collection = db.getCollection(collectionName);
  return collection.chain().data({ removeMeta: true });
}

export async function count(dbName, collectionName) {
  const docs = await find(dbName, collectionName);
  return docs.length;
}

export async function findById(dbName, collectionName, id) {
  const db = await open(dbName, collectionName);
  const collection = db.getCollection(collectionName);
  const doc = collection.by('_id', id);

  if (doc) {
    delete doc.$loki;
  }

  return doc;
}

export async function save(dbName, collectionName, docsToSaveOrUpdate) {
  const db = await open(dbName, collectionName);
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

export async function removeById(dbName, collectionName, id) {
  const db = await open(dbName, collectionName);
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

export async function clear(dbName, collectionName) {
  const db = await open(dbName, collectionName);
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

export async function clearAll(dbName) {
  const db = await open(dbName);
  return new Promise((resolve, reject) => {
    db.deleteDatabase((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

