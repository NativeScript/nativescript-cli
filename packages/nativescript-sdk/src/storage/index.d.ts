import * as SQLite from './sqlite';
export declare enum StorageProvider {
    SQLite = "SQLite"
}
export declare function getStorageAdapter(storageProvider?: StorageProvider): typeof SQLite;
