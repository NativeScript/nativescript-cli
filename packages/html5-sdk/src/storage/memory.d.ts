export declare function find(dbName: string, tableName: string): Promise<any[]>;
export declare function count(dbName: string, tableName: string): Promise<number>;
export declare function findById(dbName: string, tableName: string, id: string): Promise<any>;
export declare function save(dbName: string, tableName: string, docs?: any): Promise<any>;
export declare function removeById(dbName: string, tableName: string, id: string): Promise<1 | 0>;
export declare function clear(dbName: string, tableName: string): Promise<boolean>;
export declare function clearDatabase(): Promise<boolean>;
