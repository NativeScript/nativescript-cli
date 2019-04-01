export declare enum DataStoreType {
    Cache = "Cache",
    Network = "Network",
    Sync = "Sync"
}
export declare function collection(collectionName: string, type?: DataStoreType, options?: any): any;
export declare function getInstance(collectionName: string, type?: DataStoreType, options?: any): any;
