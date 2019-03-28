import { request as tnsRequest } from 'tns-core-modules/http';
import { HttpRequestObject, HttpResponseObject } from 'kinvey-js-sdk';

export async function send(request: HttpRequestObject): Promise<HttpResponseObject> {
  const response = await tnsRequest({
    headers: request.headers,
    method: request.method,
    url: request.url,
    content: request.body,
    timeout: request.timeout
  });

  let data;
  if (response.content) {
    try {
      data = response.content.toString();
    } catch (e) {
      // TODO: log error
      data = response.content.raw;
    }
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers as { [name: string ]: string },
    data
  };
}
