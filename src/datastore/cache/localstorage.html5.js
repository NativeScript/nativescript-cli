export default class LocalStorageStore {
  constructor(dbName, tableName) {
    this.dbName = dbName;
    this.tableName = tableName;
  }

  async find() {
    const data = window.localStorage.getItem(`${this.dbName}.${this.tableName}`);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  }

  async count() {
    const docs = await this.find();
    return docs.length;
  }

  async findById(id) {
    const docs = await this.find();
    return docs.find((doc) => doc._id === id);
  }

  async save(docs = []) {
    const existingDocs = await this.find(dbName, tableName);
    const savedDocs = docs.concat(existingDocs.filter((existingDoc) => docs.findIndex((doc) => doc._id === existingDoc._id) < 0));
    window.localStorage.setItem(`${this.dbName}.${this.tableName}`, JSON.stringify(savedDocs));
    return docs;
  }

  async removeById(id) {
    const existingDocs = await this.find();
    const index = existingDocs.findIndex((doc) => doc._id === id);
    if (index > 0) {
      existingDocs.splice(index, 1);
      window.localStorage.setItem(`${this.dbName}.${this.tableName}`, JSON.stringify(existingDocs));
      return 1;
    }
    return 0;
  }

  async clear() {
    window.localStorage.removeItem(`${this.dbName}.${this.tableName}`);
    return true;
  }

  async clearAll() {
    for (let i = 0, len = window.localStorage.length; i < len; i += 1) {
      const key = window.localStorage.key(i);
      if (key.indexOf(this.dbName) >= 0) {
        window.localStorage.removeItem(key);
      }
    }
    return true;
  }
}
