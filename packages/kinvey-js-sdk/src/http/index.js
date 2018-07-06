import parse from './parse';
import serialize from './serialize';
import Response from './response';
import Request, { RequestMethod } from './request';
import Headers, { KinveyHeaders } from './headers';

let http = async () => {
  throw new Error('You must override the default http function.');
};

/**
 * @private
 */
export function use(customHttp) {
  http = customHttp;
}

/**
 * @private
 */
export async function execute(request) {
  // Serialize request
  const serializedRequest = await serialize(request);

  // Make http request
  const responseObject = await http({
    headers: serializedRequest.headers.toObject(),
    method: serializedRequest.method,
    url: serializedRequest.url,
    body: serializedRequest.body
  });

  // Create a response
  const response = new Response({
    statusCode: responseObject.statusCode,
    headers: responseObject.headers,
    data: responseObject.data
  });

  // Parse response
  const parsedResponse = await parse(response);

  // Handle 401
  // const response = await handle401(parsedResponse);

  if (parsedResponse.isSuccess()) {
    return parsedResponse;
  }

  throw parsedResponse.error;
}

// Export
export {
  Request,
  RequestMethod,
  Headers,
  KinveyHeaders
};
