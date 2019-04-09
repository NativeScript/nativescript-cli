const store = new Map<string, Map<string, any>>();

function getTable(dbName: string, tableName: string) {
  return store.get(`${dbName}.${tableName}`) || new Map<string, any>();
}

function setTable(dbName: string, tableName: string, table: Map<string, any>) {
  return store.set(`${dbName}.${tableName}`, table);
}

export async function find(dbName: string, tableName: string) {
  const table = getTable(dbName, tableName);
  return Array.from(table.values());
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
  store.delete(`${dbName}.${tableName}`);
  return true;
}

export async function clearDatabase() {
  store.clear();
  return true;
}
