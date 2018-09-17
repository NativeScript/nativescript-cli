import isFunction from 'lodash/isFunction';
import { format } from 'url';
import { getConfig } from '../client';
import Kmd from '../kmd';
import { getSession } from './session';
import { Headers, KinveyHeaders } from './headers';

/**
 * @private
 */
export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * @private
 */
export class Request {
  constructor(request) {
    this.headers = new Headers(request.headers);
    this.method = request.method;
    this.url = request.url;
    this.body = request.body;
    this.timeout = request.timeout;
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
      const credentials = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
      this.headers.setAuthorization(`Basic ${credentials}`);
    } else if (auth === Auth.MasterSecret) {
      const { appKey, masterSecret } = getConfig();
      const credentials = Buffer.from(`${appKey}:${masterSecret}`).toString('base64');
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
