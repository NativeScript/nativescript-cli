export default class Memory {
  constructor() {
    this.data = {};
  }

  loadDatabase(dbName, callback) {
    callback(this.data[dbName]);
  }

  saveDatabase(dbName, data, callback) {
    this.data[dbName] = data;
    callback(null);
  }

  static isSupported() {
    return true;
  }
}
