import { HttpHeaders, KinveyHttpHeaders, KinveyHttpAuth } from './headers';
import { HttpResponse, HttpResponseObject } from './response';
export declare enum HttpRequestMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}
export interface HttpRequestConfig {
    headers?: HttpHeaders;
    method: HttpRequestMethod;
    url: string;
    body?: string | object;
    timeout?: number;
}
export interface HttpRequestObject {
    headers: {
        [name: string]: string;
    };
    method: string;
    url: string;
    body?: string;
    timeout?: number;
}
export interface HttpAdapter {
    send: (request: HttpRequestObject) => Promise<HttpResponseObject>;
}
export declare function serialize(contentType: string, body?: any): any;
export declare class HttpRequest {
    headers: HttpHeaders;
    method: HttpRequestMethod;
    url: string;
    body?: any;
    timeout?: number;
    constructor(config: HttpRequestConfig);
    readonly httpAdapter: HttpAdapter;
    execute(): Promise<HttpResponse>;
}
export interface KinveyHttpRequestConfig extends HttpRequestConfig {
    headers?: KinveyHttpHeaders;
    auth?: KinveyHttpAuth;
}
export declare class KinveyHttpRequest extends HttpRequest {
    headers: KinveyHttpHeaders;
    constructor(config: KinveyHttpRequestConfig);
    execute(retry?: boolean): Promise<HttpResponse>;
}
