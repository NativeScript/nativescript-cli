import { Storage, Entity } from '../storage';
import { HttpResponse } from '../http';
import { Query } from '../query';
export declare function isValidTag(tag: string): boolean;
export declare class DataStoreCache<T extends Entity> extends Storage<T> {
    constructor(collectionName: string, tag?: string);
    static clear(): Promise<any>;
}
export interface QueryEntity extends Entity {
    collectionName: string;
    query: string;
    lastRequest: string | null;
}
export declare class QueryCache extends DataStoreCache<QueryEntity> {
    constructor(tag?: string);
    serializeQuery(query?: Query): string;
    findByKey(key: string): Promise<QueryEntity>;
    saveQuery(query: Query, response: HttpResponse): Promise<QueryEntity>;
}
export declare enum SyncEvent {
    Create = "POST",
    Update = "PUT",
    Delete = "DELETE"
}
export interface SyncEntity extends Entity {
    entityId: string;
    entity: Entity;
    collection: string;
    state: {
        operation: SyncEvent;
    };
}
export declare class SyncCache extends DataStoreCache<SyncEntity> {
    constructor(tag?: string);
}
