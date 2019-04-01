export interface GetTokenWithCodeOptions {
    timeout?: number;
}
export declare function getTokenWithCode(code: string, clientId: string, redirectUri: string, options?: GetTokenWithCodeOptions): Promise<any>;
