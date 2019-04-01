export interface ExistsOptions {
    timeout?: number;
}
export declare function exists(username: string, options?: ExistsOptions): Promise<boolean>;
