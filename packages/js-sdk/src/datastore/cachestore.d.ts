import { Query } from '../query';
import { KinveyError } from '../errors/kinvey';
import { Aggregation } from '../aggregation';
import { LiveServiceReceiver } from '../live';
export declare class InvalidDeltaSetQueryError extends KinveyError {
    constructor(message?: string);
}
export declare class CacheStore {
    collectionName: string;
    tag?: string;
    useDeltaSet: boolean;
    useAutoPagination: boolean;
    autoSync: boolean;
    constructor(collectionName: string, options?: any);
    readonly pathname: string;
    find(query?: Query, options?: any): any;
    count(query?: Query, options?: any): any;
    group(aggregation: Aggregation, options?: any): any;
    findById(id: string, options?: any): any;
    create(doc: any, options?: any): Promise<any>;
    update(doc: any, options?: any): Promise<any>;
    save(doc: any, options?: any): Promise<any>;
    remove(query?: Query, options?: any): Promise<{
        count: number;
    }>;
    removeById(id: string, options?: any): Promise<{
        count: number;
    }>;
    clear(query?: Query): Promise<{
        count: number;
    }>;
    push(query?: Query, options?: any): Promise<any>;
    pull(query?: Query, options?: any): Promise<any>;
    pullById(id: string, options?: any): Promise<any>;
    sync(query?: Query, options?: any): Promise<{
        push: any;
        pull: any;
    }>;
    pendingSyncDocs(query?: Query): Promise<import("./cache").SyncEntity[]>;
    pendingSyncEntities(query?: Query): Promise<import("./cache").SyncEntity[]>;
    pendingSyncCount(query?: Query): Promise<number>;
    clearSync(query?: Query): Promise<number>;
    subscribe(receiver: LiveServiceReceiver, options?: any): Promise<boolean>;
    unsubscribe(options?: any): Promise<boolean>;
}
