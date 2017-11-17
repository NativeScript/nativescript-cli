const { Storage } = require('kinvey-request');
const { IndexedDBAdapter } = require('./indexeddb');
const { WebSQLAdapter } = require('./websql');
const { LocalStorageAdapter, SessionStorageAdapter } = require('./webstorage');

exports.Storage = class Html5Storage extends Storage {
  loadAdapter() {
    return WebSQLAdapter.load(this.name)
      .then((adapter) => {
        if (!adapter) {
          return IndexedDBAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return LocalStorageAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return SessionStorageAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return super.loadAdapter();
        }

        return adapter;
      });
  }
}
