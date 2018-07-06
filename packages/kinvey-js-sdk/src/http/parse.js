import cloneDeep from 'lodash/cloneDeep';
import Response from './response';

/**
 * @private
 */
export default async function parse(response) {
  if (!response) {
    throw new Error('No response provided.');
  }

  const { statusCode, headers } = response;
  let data = cloneDeep(response.data);

  if (headers.has('Content-Type')) {
    const contentType = headers.get('Content-Type');

    if (contentType.indexOf('application/json') === 0) {
      try {
        data = JSON.parse(data);
      } catch (error) {
        // TODO: log error
      }
    }

    return new Response({
      statusCode,
      headers,
      data
    });
  }

  return response;
}
