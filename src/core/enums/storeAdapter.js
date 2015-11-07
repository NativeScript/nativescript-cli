const StoreAdapter = {
  IndexedDB: 'idb',
  LocalStorage: 'localstorage',
  Memory: 'memory',
  WebSQL: 'websql'
};
Object.freeze(StoreAdapter);
module.exports = StoreAdapter;
