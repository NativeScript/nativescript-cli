import localforage from 'localforage';
import MemoryDriver from '../storage/drivers/memory';

const StorageDriver = {
  IndexedDB: localforage.INDEXEDDB,
  LocalStorage: localforage.LOCALSTORAGE,
  Memory: MemoryDriver._driver,
  WebSQL: localforage.WEBSQL
};
Object.freeze(StorageDriver);
export default StorageDriver;
