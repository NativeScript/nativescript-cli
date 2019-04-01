export declare class HttpHeaders {
    private headers;
    private normalizedNames;
    constructor(headers?: HttpHeaders);
    constructor(headers?: {
        [name: string]: string | string[];
    });
    constructor(headers?: {
        [name: string]: () => string | string[];
    });
    readonly contentType: string;
    has(name: string): boolean;
    get(name: string): string | null;
    keys(): string[];
    set(name: string, value: string | string[]): HttpHeaders;
    set(name: string, value: () => string | string[]): HttpHeaders;
    join(headers: HttpHeaders): void;
    delete(name: string): boolean;
    toObject(): {};
}
export declare enum KinveyHttpAuth {
    App = "App",
    Master = "Master",
    Session = "Session",
    SessionOrApp = "SessionOrApp"
}
export declare function getAppVersion(): string;
export declare function setAppVersion(appVersion: string): string;
export declare class KinveyHttpHeaders extends HttpHeaders {
    constructor(headers?: KinveyHttpHeaders);
    constructor(headers?: {
        [name: string]: string | string[];
    });
    constructor(headers?: {
        [name: string]: () => string | string[];
    });
    readonly requestStart: string;
    setAuthorization(auth: KinveyHttpAuth): void;
    setCustomRequestProperties(properties: {}): void;
}
