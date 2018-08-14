import parse from './parse';
import serialize from './serialize';
import Response from './response';

let http = async () => {
  throw new Error('You must override the default http function.');
};

/**
 * @private
 */
export function use(httpAdapter) {
  http = httpAdapter;
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
  Auth,
  Request,
  KinveyRequest,
  RequestMethod,
  formatKinveyAuthUrl,
  formatKinveyBaasUrl
} from './request';
export {
  getSession,
  setSession,
  removeSession
} from './session';
