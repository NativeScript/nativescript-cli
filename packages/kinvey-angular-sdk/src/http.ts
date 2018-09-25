import axios from 'axios';

export default async function http(request) {
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
        throw new Error('The network request timed out.');
      } else if (error.code === 'ENOENT') {
        throw new Error('You do not have a network connection.');
      }

      throw error;
    } else {
      throw error;
    }
  }

  return { statusCode: response.status, headers: response.headers, data: response.data };
}
