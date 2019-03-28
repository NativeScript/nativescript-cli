export async function find(dbName: string, tableName: string) {
  const data = window.sessionStorage.getItem(`${dbName}.${tableName}`);
  if (data) {
    return JSON.parse(data);
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
  const existingDocs = await find(dbName, tableName);
  const savedDocs = docs.concat(existingDocs.filter((existingDoc: any) => docs.findIndex((doc: any) => doc._id === existingDoc._id) < 0));
  window.sessionStorage.setItem(`${dbName}.${tableName}`, JSON.stringify(savedDocs));
  return docs;
}

export async function removeById(dbName: string, tableName: string, id: string) {
  const existingDocs = await find(dbName, tableName);
  const index = existingDocs.findIndex((doc: any) => doc._id === id);
  if (index > 0) {
    existingDocs.splice(index, 1);
    window.sessionStorage.setItem(`${dbName}.${tableName}`, JSON.stringify(existingDocs));
    return 1;
  }
  return 0;
}

export async function clear(dbName: string, tableName: string) {
  window.sessionStorage.removeItem(`${dbName}.${tableName}`);
  return true;
}

export async function clearDatabase(dbName: string) {
  for (let i = 0, len = window.sessionStorage.length; i < len; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key && key.indexOf(dbName) >= 0) {
      window.sessionStorage.removeItem(key);
    }
  }
  return true;
}
