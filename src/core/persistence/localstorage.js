let localStorage = undefined;

if (typeof window !== 'undefined') {
  localStorage = window.localStorage;
}

class LocalStorage {
  loadDatabase(dbName, callback) {
    callback(localStorage.getItem(dbName));
  }

  saveDatabase(dbName, data, callback) {
    localStorage.setItem(dbName, data);
    callback(null);
  }

  static isSupported() {
    const item = 'kinvey';
    try {
      localStorage.setItem(item, item);
      localStorage.removeItem(item);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = LocalStorage;
