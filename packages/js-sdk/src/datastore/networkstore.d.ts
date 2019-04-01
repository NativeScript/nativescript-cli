import { Aggregation } from '../aggregation';
import { Query } from '../query';
import { HttpRequestMethod, KinveyHttpRequest } from '../http';
import { LiveServiceReceiver } from '../live';
export declare function createRequest(method: HttpRequestMethod, url: string, body?: any): KinveyHttpRequest;
export declare class NetworkStore {
    collectionName: string;
    constructor(collectionName: string);
    readonly collection: string;
    readonly pathname: string;
    readonly channelName: string;
    readonly personalChannelName: string;
    find(query?: Query, options?: any): any;
    count(query?: Query, options?: any): any;
    group(aggregation: Aggregation, options?: any): any;
    findById(id: string, options?: any): any;
    create(doc: any, options?: any): Promise<any>;
    update(doc: any, options?: any): Promise<any>;
    save(doc: any, options?: any): Promise<any>;
    remove(query?: Query, options?: any): Promise<any>;
    removeById(id: string, options?: any): Promise<any>;
    subscribe(receiver: LiveServiceReceiver, options?: any): Promise<boolean>;
    unsubscribe(options?: any): Promise<boolean>;
}
