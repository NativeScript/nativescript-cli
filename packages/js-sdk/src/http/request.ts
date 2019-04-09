import isString from 'lodash/isString';
import PQueue from 'p-queue';
import { Base64 } from 'js-base64';
import { InvalidCredentialsError } from '../errors/invalidCredentials';
import { getAppSecret} from '../kinvey';
import { logger } from '../log';
import { DataStoreCache, QueryCache, SyncCache } from '../datastore/cache';
import { HttpHeaders, KinveyHttpHeaders, KinveyHttpAuth } from './headers';
import { HttpResponse } from './response';
import { send } from './http';
import { getSession, setSession, removeSession } from './session';
import { formatKinveyAuthUrl, formatKinveyBaasUrl, KinveyBaasNamespace } from './utils';

const REQUEST_QUEUE = new PQueue();
let refreshTokenRequestInProgress = false;

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
};

export interface HttpRequestConfig {
  headers?: HttpHeaders;
  method: HttpRequestMethod;
  url: string;
  body?: string | object;
  timeout?: number;
}

export function serialize(contentType: string, body?: any) {
  if (body && !isString(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str: string[] = [];
      Object.keys(body).forEach((key) => {
        str.push(`${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`);
      });
      return str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

export class HttpRequest {
  public headers: HttpHeaders;
  public method: HttpRequestMethod = HttpRequestMethod.GET;
  public url: string;
  public body?: any;
  public timeout?: number;

  constructor(config: HttpRequestConfig) {
    this.headers = new HttpHeaders(config.headers);

    if (config.method) {
      this.method = config.method;
    }

    this.url = config.url;
    this.body = config.body;
    this.timeout = config.timeout;
  }

  async execute(): Promise<HttpResponse> {
    // Make http request
    const response = await send(this.toPlainObject());

    // Return the response if it was successful
    if (response.isSuccess()) {
      return response;
    }

    // Else throw the error
    throw response.error;
  }

  toPlainObject() {
    return {
      headers: this.headers.toPlainObject(),
      method: this.method,
      url: this.url,
      body: this.body ? serialize(this.headers.contentType!, this.body) : undefined,
      timeout: this.timeout
    };
  }
}

function isRefreshTokenRequestInProgress() {
  return refreshTokenRequestInProgress === true;
}

function markRefreshTokenRequestInProgress() {
  REQUEST_QUEUE.pause();
  refreshTokenRequestInProgress = true;
}

function markRefreshTokenRequestComplete() {
  refreshTokenRequestInProgress = false;
  REQUEST_QUEUE.start();
}

export interface KinveyHttpRequestConfig extends HttpRequestConfig {
  headers?: KinveyHttpHeaders;
  auth?: KinveyHttpAuth;
}

export class KinveyHttpRequest extends HttpRequest {
  public headers: KinveyHttpHeaders;
  public auth?: KinveyHttpAuth;

  constructor(config: KinveyHttpRequestConfig) {
    super(config);
    this.headers = new KinveyHttpHeaders(config.headers);

    if (config.auth) {
      this.headers.setAuthorization(config.auth);
      this.auth = config.auth;
    }
  }

  async execute(retry = true): Promise<HttpResponse> {
    try {
      return await super.execute();
    } catch (error) {
      if (retry) {
        // Received an InvalidCredentialsError
        if (error instanceof InvalidCredentialsError) {
          if (isRefreshTokenRequestInProgress()) {
            return REQUEST_QUEUE.add(() => {
              const request = new KinveyHttpRequest(this);
              return request.execute(false).catch(() => Promise.reject(error));
            });
          }

          // Mark refresh token request in progress
          markRefreshTokenRequestInProgress();

          // Get existing mic session
          const activeSession = getSession();
          const socialIdentity = (activeSession && activeSession._socialIdentity) || {};
          const micIdentityKey = Object.keys(socialIdentity).find(sessionKey => socialIdentity[sessionKey].identity === 'kinveyAuth');

          if (micIdentityKey) {
            const micSession = socialIdentity[micIdentityKey];

            if (micSession) {
              try {
                // Refresh the MIC session
                const refreshRequest = new KinveyHttpRequest({
                  method: HttpRequestMethod.POST,
                  headers: new KinveyHttpHeaders({
                    'Content-Type': () => 'application/x-www-form-urlencoded',
                    Authorization: () => {
                      const credentials = Base64.encode(`${micSession.client_id}:${getAppSecret()}`);
                      return `Basic ${credentials}`;
                    }
                  }),
                  url: formatKinveyAuthUrl('/oauth/token'),
                  body: {
                    grant_type: 'refresh_token',
                    client_id: micSession.client_id,
                    redirect_uri: micSession.redirect_uri,
                    refresh_token: micSession.refresh_token
                  }
                });
                const refreshResponse = await refreshRequest.execute();

                // Create a new MIC session
                const newMICSession = Object.assign({}, micSession, refreshResponse.data);

                // Login with the new MIC session
                const loginRequest = new KinveyHttpRequest({
                  method: HttpRequestMethod.POST,
                  auth: KinveyHttpAuth.App,
                  url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
                  body: {
                    _socialIdentity: {
                      [micIdentityKey]: newMICSession
                    }
                  }
                });
                const loginResponse = await loginRequest.execute();
                const newSession = loginResponse.data;
                newSession._socialIdentity[micIdentityKey] = Object.assign({}, newSession._socialIdentity[micIdentityKey], newMICSession);

                // Set the new session
                setSession(newSession);

                // Redo the original request
                const request = new KinveyHttpRequest(this);
                const response = await request.execute(false);

                // Mark the refresh token as complete
                markRefreshTokenRequestComplete();

                // Return the response
                return response;
              } catch (error) {
                logger.error(error.message);
              }
            }
          }

          try {
            // TODO: Unregister from live service

            // Logout
            const request = new KinveyHttpRequest({
              method: HttpRequestMethod.POST,
              auth: KinveyHttpAuth.Session,
              url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_logout')
            });
            await request.execute(false);

            // Remove the session
            removeSession();

            // Clear cache's
            await QueryCache.clear();
            await SyncCache.clear();
            await DataStoreCache.clear();
          } catch (error) {
            logger.error(error.message);
          }
        }

        // Mark the refresh token as complete
        markRefreshTokenRequestComplete();
      }

      // Throw the error
      throw error;
    }
  }
}
