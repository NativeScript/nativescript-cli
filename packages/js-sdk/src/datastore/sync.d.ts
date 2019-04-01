import { Query } from '../query';
import { SyncEvent } from './cache';
export declare function queryToSyncQuery(query?: Query, collectionName?: string): Query;
export declare class Sync {
    collectionName: string;
    tag?: string;
    constructor(collectionName: string, tag?: string);
    isPushInProgress(): boolean;
    find(query?: Query): Promise<import("./cache").SyncEntity[]>;
    findById(id: string): Promise<import("..").Entity>;
    count(query?: Query): Promise<number>;
    addCreateSyncEvent(docs: any): Promise<any>;
    addUpdateSyncEvent(docs: any): Promise<any>;
    addDeleteSyncEvent(docs: any): Promise<any>;
    addSyncEvent(event: SyncEvent, docs: any): Promise<any>;
    push(query?: Query, options?: any): Promise<any>;
    remove(query?: Query): Promise<number>;
    removeById(id: string): Promise<number>;
    clear(): Promise<number>;
}
