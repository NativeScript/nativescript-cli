function getTable(dbName: string, tableName: string) {
  const tableJson = window.localStorage.getItem(`${dbName}.${tableName}`);
  if (tableJson) {
    return new Map<string, any>(JSON.parse(tableJson));
  }
  return new Map<string, any>();
}

function setTable(dbName: string, tableName: string, table: Map<string, any>) {
  window.localStorage.setItem(`${dbName}.${tableName}`, JSON.stringify([...table]));
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

export async function clearDatabase(dbName: string) {
  for (let i = 0, len = window.localStorage.length; i < len; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.indexOf(dbName) >= 0) {
      window.localStorage.removeItem(key);
    }
  }
  return true;
}
