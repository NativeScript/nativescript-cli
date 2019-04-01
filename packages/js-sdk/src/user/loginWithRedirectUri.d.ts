export interface MICOptions {
    micId?: string;
    version?: string | number;
    timeout?: number;
}
export declare function loginWithRedirectUri(redirectUri: string, options?: MICOptions): Promise<import("./user").User>;
