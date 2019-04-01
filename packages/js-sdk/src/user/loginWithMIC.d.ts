export declare enum AuthorizationGrant {
}
export declare function loginWithMIC(redirectUri: string, authorizationGrant: AuthorizationGrant, options: any): Promise<import("./user").User>;
