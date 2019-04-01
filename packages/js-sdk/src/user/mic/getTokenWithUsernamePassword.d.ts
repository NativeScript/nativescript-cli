export interface GetTokenWithUsernamePasswordOptions {
    timeout?: number;
}
export declare function getTokenWithUsernamePassword(username: string, password: string, clientId: string, options?: GetTokenWithUsernamePasswordOptions): Promise<any>;
