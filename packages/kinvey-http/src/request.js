import isNumber from 'lodash/isNumber';
import { KinveyError, InvalidCredentialsError } from 'kinvey-errors';
import { getConfig } from 'kinvey-app';
import { get as getSession, set as setSession, remove as removeSession } from 'kinvey-session';
import { clear } from 'kinvey-cache';
import PQueue from 'promise-queue';
import { Base64 } from 'js-base64';
import { Headers, KinveyHeaders } from './headers';
import { serialize, formatKinveyUrl } from './utils';
import { Response } from './response';
import { app, master, session as sessionAuth, basic, defaultAuth, all, Auth } from './auth';

const requestQueue = new PQueue();

const AUTHORIZATION_HEADER = 'Authorization';
export const RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

let http = async () => {
  throw new Error('You must override the default http function.');
};

export function register(httpAdapter) {
  http = httpAdapter;
}

export class Request {
  constructor(request = {}) {
    const { defaultTimeout } = getConfig();
    const {
      headers,
      method,
      url,
      body,
      timeout = defaultTimeout
    } = request;

    this.headers = headers;
    this.method = method;
    this.url = url;
    this.body = body;
    this.timeout = timeout;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new Headers(headers);
  }

  get timeout() {
    return this._timeout;
  }

  set timeout(timeout) {
    if (!isNumber(timeout) || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    this._timeout = timeout;
  }

  async execute() {
    // Make http request
    const responseObject = await http({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: serialize(this.headers.contentType, this.body),
      timeout: this.timeout
    });

    // Create a response
    const response = new Response({
      statusCode: responseObject.statusCode,
      headers: responseObject.headers,
      data: responseObject.data
    });

    // Return the response if it was successful
    if (response.isSuccess()) {
      return response;
    }

    // Else throw the error
    throw response.error;
  }
}

export class KinveyRequest extends Request {
  constructor(request) {
    super(request);
    this.headers = request.headers;
    this.auth = request.auth;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    this._headers = new KinveyHeaders(headers);
  }

  get authorizationHeader() {
    const { appKey, appSecret, masterSecret } = getConfig();
    const session = getSession();

    if (this.auth === Auth.App) {
      return app(appKey, appSecret);
    } else if (this.auth === Auth.Master) {
      return master(appKey, masterSecret);
    } else if (this.auth === Auth.Session) {
      return sessionAuth(session);
    } else if (this.auth === Auth.Basic) {
      return basic(appKey, appSecret, masterSecret);
    } else if (this.auth === Auth.Default) {
      return defaultAuth(session, appKey, masterSecret);
    } else if (this.auth === Auth.All) {
      return all(session, appKey, appSecret, masterSecret);
    }

    return null;
  }

  async execute(retry = true) {
    try {
      // Set the authorization header
      if (this.auth) {
        this.headers.set(AUTHORIZATION_HEADER, this.authorizationHeader);
      }

      // Execute the request
      const response = await super.execute();
      return response;
    } catch (error) {
      if (retry) {
        // Received an InvalidCredentialsError
        if (error instanceof InvalidCredentialsError) {
          const { appKey, appSecret, auth, api } = getConfig();
          const activeSession = getSession();
          const socialIdentity = (activeSession && activeSession._socialIdentity) || {};
          const micIdentityKey = Object.keys(socialIdentity)
            .find(sessionKey => socialIdentity[sessionKey].identity === 'kinveyAuth');
          const micIdentity = socialIdentity[micIdentityKey];

          // Queue the request if the request que is paused
          if (requestQueue.paused) {
            return requestQueue.add(() => this.execute(false).catch(() => Promise.reject(error)));
          }

          if (micIdentity) {
            try {
              // Pause the request queue
              requestQueue.pause();

              // Refresh the session
              const refreshRequest = new KinveyRequest({
                method: RequestMethod.POST,
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: () => {
                    const credentials = Base64.encode(`${micIdentity.client_id}:${appSecret}`);
                    return `Basic ${credentials}`;
                  }
                },
                url: formatKinveyUrl(auth.protocol, auth.host, '/oauth/token'),
                body: {
                  grant_type: 'refresh_token',
                  client_id: micIdentity.client_id,
                  redirect_uri: micIdentity.redirect_uri,
                  refresh_token: micIdentity.refresh_token
                }
              });
              const refreshResponse = await refreshRequest.execute();

              // Create a new session
              const newMicIdentity = Object.assign({}, refreshResponse.data, {
                client_id: micIdentity.client_id,
                redirect_uri: micIdentity.redirect_uri,
                protocol: auth.protocol,
                host: auth.host
              });

              // Login the new MIC identity
              const loginRequest = new KinveyRequest({
                method: RequestMethod.POST,
                auth: Auth.App,
                url: formatKinveyUrl(api.protocol, api.host, `/user/${appKey}/login`),
                properties: this.properties,
                body: {
                  _socialIdentity: {
                    [micIdentityKey]: newMicIdentity
                  }
                }
              });
              const loginResponse = await loginRequest.execute();
              const newSession = loginResponse.data;
              newSession._socialIdentity[micIdentityKey] = Object.assign({}, newSession._socialIdentity[micIdentityKey], newMicIdentity);

              // Set the new session
              setSession(newSession);

              // Redo the original request
              const response = await this.execute(false);

              // Start the request queue
              requestQueue.start();

              // Return the response
              return response;
            } catch (error) {
              // TODO: Log error
            }
          }

          try {
            // TODO: Unregister from live service

            // Logout
            const url = formatKinveyUrl(api.protocol, api.host, `/user/${appKey}/_logout`);
            const request = new KinveyRequest({
              method: RequestMethod.POST,
              auth: Auth.Session,
              url
            });
            await request.execute(false);

            // Remove the session
            removeSession();

            // Clear data
            clear(appKey);
          } catch (error) {
            // TODO: Log error
          }
        }

        // Start the request queue
        requestQueue.start();
      }

      // Throw the error
      throw error;
    }
  }
}
