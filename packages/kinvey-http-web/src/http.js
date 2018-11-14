import { register as _register } from 'kinvey-http';
import { register as registerSession } from 'kinvey-session-web';
import { TimeoutError, NetworkConnectionError } from 'kinvey-errors';
import axios from 'axios';

export async function http(request) {
  let response;

  try {
    response = await axios({
      headers: request.headers,
      method: request.method,
      url: request.url,
      data: request.body
    });
  } catch (error) {
    if (error.response) {
      // eslint-disable-next-line prefer-destructuring
      response = error.response;
    } else if (error.request) {
      if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new TimeoutError('The network request timed out.');
      } else if (error.code === 'ENOENT') {
        throw new NetworkConnectionError('You do not have a network connection.');
      }

      throw error;
    } else {
      throw error;
    }
  }

  return { statusCode: response.status, headers: response.headers, data: response.data };
}

export function register() {
  _register(http);
  registerSession();
}
