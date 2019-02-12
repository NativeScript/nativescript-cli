export async function find(dbName, tableName) {
  const data = window.localStorage.getItem(`${dbName}.${tableName}`);
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

export async function count(dbName, tableName) {
  const docs = find(dbName, tableName);
  return docs.length;
}

export async function findById(dbName, tableName, id) {
  const docs = find(dbName, tableName);
  return docs.find((doc) => doc._id === id);
}

export async function save(dbName, tableName, docs = []) {
  const existingDocs = find(dbName, tableName);
  const savedDocs = docs.concat(existingDocs.filter((existingDoc) => docs.findIndex((doc) => doc._id === existingDoc._id) < 0));
  window.localStorage.setItem(`${dbName}.${tableName}`, JSON.stringify(savedDocs));
  return docs;
}

export async function removeById(dbName, tableName, id) {
  const existingDocs = find(dbName, tableName);
  const index = existingDocs.findIndex((doc) => doc._id === id);
  if (index > 0) {
    existingDocs.splice(index, 1);
    window.localStorage.setItem(`${dbName}.${tableName}`, JSON.stringify(existingDocs));
    return 1;
  }
  return 0;
}

export async function clear(dbName, tableName) {
  window.localStorage.removeItem(`${dbName}.${tableName}`);
  return true;
}

export async function clearAll(dbName) {
  for (let i = 0, len = window.localStorage.length; i < len; i += 1) {
    const key = window.localStorage.key(i);
    if (key.indexOf(dbName) >= 0) {
      window.localStorage.removeItem(key);
    }
  }
  return true;
}
