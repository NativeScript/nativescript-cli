import { ConfigKey, getConfig } from '../config';
import { HttpHeaders } from './headers';
import { HttpResponse } from './response';

export interface HttpRequestObject {
  headers: { [name: string]: string };
  method: string;
  url: string;
  body?: string;
  timeout?: number;
}

export interface HttpResponseObject {
  statusCode: number;
  headers: { [name: string]: string };
  data?: string;
}

export interface HttpAdapter {
  send: (request: HttpRequestObject) => Promise<HttpResponseObject>;
}

function getHttpAdapter() {
  return getConfig<HttpAdapter>(ConfigKey.HttpAdapter);
}

export async function send(request: HttpRequestObject) {
  const responseObject = await getHttpAdapter().send(request);
  return new HttpResponse({
    statusCode: responseObject.statusCode,
    headers: new HttpHeaders(responseObject.headers),
    data: responseObject.data
  });
}
