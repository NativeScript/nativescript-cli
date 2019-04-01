export declare function find(dbName: string, objectStoreName: string): Promise<any[]>;
export declare function count(dbName: string, objectStoreName: string): Promise<number>;
export declare function findById(dbName: string, objectStoreName: string, id: string): Promise<{}>;
export declare function save(dbName: string, objectStoreName: string, docs?: any): Promise<any[]>;
export declare function removeById(dbName: string, objectStoreName: string, id: string): Promise<number>;
export declare function clear(dbName: string, objectStoreName: string): Promise<any>;
export declare function clearDatabase(dbName: string): Promise<{}>;
