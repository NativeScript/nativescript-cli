const StoreAdapter = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  WebSQL: 'WebSQL'
};
Object.freeze(StoreAdapter);
module.exports = StoreAdapter;
