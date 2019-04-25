function getTable(dbName: string, tableName: string) {
  const docsJson = window.localStorage.getItem(`${dbName}.${tableName}`);
  if (docsJson) {
    const docs = JSON.parse(docsJson);
    const map = new Map<string, any>();
    docs.forEach((doc) => {
      map.set(doc._id, doc);
    });
    return map;
  }
  return new Map<string, any>();
}

function setTable(dbName: string, tableName: string, table: Map<string, any>) {
  const docs = [];
  table.forEach((value) => docs.push(value));
  window.localStorage.setItem(`${dbName}.${tableName}`, JSON.stringify(docs));
}

export async function find(dbName: string, tableName: string) {
  const table = getTable(dbName, tableName);
  if (table) {
    return Array.from(table.values());
  }
  return [];
}

export async function count(dbName: string, tableName: string) {
  const docs = await find(dbName, tableName);
  return docs.length;
}

export async function findById(dbName: string, tableName: string, id: string) {
  const docs = await find(dbName, tableName);
  return docs.find((doc: any) => doc._id === id);
}

export async function save(dbName: string, tableName: string, docs: any = []) {
  const table = getTable(dbName, tableName);
  docs.forEach((doc: { _id: string; }) => {
    table.set(doc._id, doc);
  });
  setTable(dbName, tableName, table);
  return docs;
}

export async function removeById(dbName: string, tableName: string, id: string) {
  const table = getTable(dbName, tableName);
  if (table.delete(id)) {
    setTable(dbName, tableName, table);
    return 1;
  }
  return 0;
}

export async function clear(dbName: string, tableName: string) {
  window.localStorage.removeItem(`${dbName}.${tableName}`);
  return true;
}

export async function clearDatabase(dbName: string, exclude: string[] = []) {
  const keys = [];

  for (let i = 0, len = window.localStorage.length; i < len; i += 1) {
    keys.push(window.localStorage.key(i));
  }

  keys.forEach((key) => {
    if (key && key.indexOf(dbName) >= 0 && exclude.indexOf(key) === -1) {
      window.localStorage.removeItem(key);
    }
  });

  return true;
}
