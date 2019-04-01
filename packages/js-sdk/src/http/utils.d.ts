export declare enum KinveyBaasNamespace {
    AppData = "appdata",
    Blob = "blob",
    Rpc = "rpc",
    User = "user"
}
export declare function formatKinveyBaasUrl(namespace: KinveyBaasNamespace, path?: string, query?: {
    [key: string]: any;
}): string;
export declare function formatKinveyAuthUrl(path?: string, query?: {
    [key: string]: any;
}): string;
