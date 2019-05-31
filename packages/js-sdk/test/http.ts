import axios from 'axios';
import { NetworkError } from '../src/errors/network';

export async function send(request: any) {
  const { url, method, headers, body, timeout } = request;
  let response;

  try {
    response = await axios({
      headers,
      method,
      url,
      data: body,
      timeout
    });
  } catch (error) {
    if (!error.response) {
      throw new NetworkError();
    }
    response = error.response;
  }

  return {
    statusCode: response.status,
    headers: response.headers,
    data: response.data
  };
}
