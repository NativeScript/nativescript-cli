import axios from 'axios';
import { HttpRequestObject } from 'kinvey-js-sdk';

export async function send(request: HttpRequestObject) {
  let response;

  try {
    response = await axios({
      headers: request.headers,
      method: request.method,
      url: request.url,
      data: request.body,
      timeout: request.timeout
    });
  } catch (error) {
    if (error.response) {
      response = error.response;
    }

    throw error;
  }

  return { statusCode: response.status, headers: response.headers, data: response.data };
}
