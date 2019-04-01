import { Query } from '../query';
export interface LookupOptions {
    timeout?: number;
}
export declare function lookup(query?: Query, options?: LookupOptions): any;
