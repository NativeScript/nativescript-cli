import { Base64 } from 'js-base64';
import { formatKinveyAuthUrl, HttpRequestMethod, KinveyHttpRequest, KinveyHttpAuth, KinveyHttpHeaders } from '../../http';
import { getAuthProtocol, getAuthHost, getAppSecret } from '../../kinvey';
import { Identity } from './utils';

export interface GetTokenWithCodeOptions {
  timeout?: number;
}

// export interface Token {
//   identity: string;
//   client_id: string;
//   redirect_uri: string;
//   protocol: string;
//   host: string;
// }

export async function getTokenWithCode(code: string, clientId: string, redirectUri: string, options: GetTokenWithCodeOptions = {}) {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    headers: new KinveyHttpHeaders({
      'Content-Type': () => 'application/x-www-form-urlencoded',
      Authorization: () => {
        const credentials = Base64.encode(`${clientId}:${getAppSecret()}`);
        return `Basic ${credentials}`;
      }
    }),
    url: formatKinveyAuthUrl('/oauth/token'),
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    },
    timeout: options.timeout
  });
  const response = await request.execute();
  const token = response.data;
  return Object.assign({}, {
    identity: Identity,
    client_id: clientId,
    redirect_uri: redirectUri,
    protocol: getAuthProtocol(),
    host: getAuthHost()
  }, token);
}
