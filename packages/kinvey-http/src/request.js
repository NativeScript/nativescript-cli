import isFunction from 'lodash/isFunction';
import { format } from 'url';
import { Base64 } from 'js-base64';
import { getConfig } from 'kinvey-app';
import { Kmd } from 'kinvey-kmd';
import { getSession } from 'kinvey-session';
import { Headers, KinveyHeaders } from './headers';
import { serialize } from './utils'

let http = async () => {
  throw new Error('You must override the default http function.');
};

export function register(httpAdapter) {
  http = httpAdapter;
}

export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

export class Request {
  constructor(request) {
    this.headers = request.headers;
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new Headers(headers);
  }

  get body() {
    return this._body;
  }

  set body(body) {
    this._body = serialize(this.headers.contentType, body);
  }

  async execute() {
    // Make http request
    const responseObject = await http({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: this.body
    });

    // Create a response
    const response = new Response({
      statusCode: responseObject.statusCode,
      headers: responseObject.headers,
      data: responseObject.data
    });

    // Handle 401
    // const response = await handle401(response);

    if (response.isSuccess()) {
      return response;
    }

    throw response.error;
  }
}

function getKinveyUrl(protocol, host, pathname, query) {
  const { appKey } = getConfig();
  return format({
    protocol,
    host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query
  });
}

export function formatKinveyAuthUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

export function formatKinveyBaasUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
}

export const Auth = {
  App: 'App',
  Default: 'Default',
  MasterSecret: 'MasterSecret',
  Session: 'Session'
};

export class KinveyRequest extends Request {
  constructor(request) {
    super(request);
    this.headers = new KinveyHeaders(request.headers);
    this.auth = request.auth;
  }

  set auth(auth) {
    if (auth === Auth.Default) {
      try {
        this.auth = Auth.Session;
      } catch (error) {
        this.auth = Auth.MasterSecret;
      }
    }

    if (isFunction(auth)) {
      const value = auth();
      this.headers.setAuthorization(value);
    } else if (auth === Auth.App) {
      const { appKey, appSecret } = getConfig();
      const credentials = Base64.encode(`${appKey}:${appSecret}`);
      this.headers.setAuthorization(`Basic ${credentials}`);
    } else if (auth === Auth.MasterSecret) {
      const { appKey, masterSecret } = getConfig();
      const credentials = Base64.encode(`${appKey}:${masterSecret}`);
      this.headers.setAuthorization(`Basic ${credentials}`);
    } else if (auth === Auth.Session) {
      const session = getSession();

      if (!session) {
        throw new Error('There is no active user to authorize the request. Please login and retry the request.');
      }

      const kmd = new Kmd(session._kmd);
      this.headers.setAuthorization(`Kinvey ${kmd.authtoken}`);
    }
  }
}
