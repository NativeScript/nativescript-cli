class LocalStorage {
  loadDatabase(dbName, callback) {
    callback(localStorage.getItem(dbName));
  }

  saveDatabase(dbName, data, callback) {
    localStorage.setItem(dbName, data);
    callback(null);
  }

  static isSupported() {
    var mod = 'kinvey';
    try {
      window.localStorage.setItem(mod, mod);
      window.localStorage.removeItem(mod);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = LocalStorage;
