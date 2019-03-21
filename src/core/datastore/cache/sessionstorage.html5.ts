export default class SessionStorageStore {
  private dbName: string;
  private tableName: string;

  constructor(dbName, tableName) {
    this.dbName = dbName;
    this.tableName = tableName;
  }

  async find() {
    const data = window.sessionStorage.getItem(`${this.dbName}.${this.tableName}`);
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
    const existingDocs = await this.find();
    const savedDocs = docs.concat(existingDocs.filter((existingDoc) => docs.findIndex((doc) => doc._id === existingDoc._id) < 0));
    window.sessionStorage.setItem(`${this.dbName}.${this.tableName}`, JSON.stringify(savedDocs));
    return docs;
  }

  async removeById(id) {
    const existingDocs = await this.find();
    const index = existingDocs.findIndex((doc) => doc._id === id);
    if (index > 0) {
      existingDocs.splice(index, 1);
      window.sessionStorage.setItem(`${this.dbName}.${this.tableName}`, JSON.stringify(existingDocs));
      return 1;
    }
    return 0;
  }

  async clear() {
    window.sessionStorage.removeItem(`${this.dbName}.${this.tableName}`);
    return true;
  }

  async clearAll() {
    for (let i = 0, len = window.sessionStorage.length; i < len; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key.indexOf(this.dbName) >= 0) {
        window.sessionStorage.removeItem(key);
      }
    }
    return true;
  }
}
