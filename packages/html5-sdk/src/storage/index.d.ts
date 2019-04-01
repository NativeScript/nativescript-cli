import * as IndexedDB from './indexeddb';
import * as WebSQL from './websql';
export declare enum StorageProvider {
    IndexedDB = "IndexedDB",
    LocalStorage = "LocalStorage",
    Memory = "Memory",
    SessionStorage = "SessionStorage",
    WebSQL = "WebSQL"
}
export declare function getStorageAdapter(storageProvider?: StorageProvider): typeof IndexedDB | typeof WebSQL;
