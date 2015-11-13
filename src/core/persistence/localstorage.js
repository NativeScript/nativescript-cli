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
    const mod = 'kinvey';
    try {
      localStorage.setItem(mod, mod);
      localStorage.removeItem(mod);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = LocalStorage;
