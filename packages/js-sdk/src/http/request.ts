import isString from 'lodash/isString';
import PQueue from 'p-queue';
import { Base64 } from 'js-base64';
import { ConfigKey, getConfig } from '../config';
import { InvalidCredentialsError } from '../errors/invalidCredentials';
import { getAppKey, getAppSecret, getAuthProtocol, getAuthHost } from '../kinvey';
import { Storage } from '../storage';
import { HttpHeaders, KinveyHttpHeaders, KinveyHttpAuth } from './headers';
import { HttpResponse, HttpResponseObject } from './response';
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

export interface HttpRequestObject {
  headers: { [name: string]: string };
  method: string;
  url: string;
  body?: string;
  timeout?: number;
}

export interface HttpAdapter {
  send: (request: HttpRequestObject) => Promise<HttpResponseObject>;
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

  get httpAdapter() {
    return getConfig<HttpAdapter>(ConfigKey.HttpAdapter);
  }

  async execute(): Promise<HttpResponse> {
    // Make http request
    const responseObject = await this.httpAdapter.send({
      headers: this.headers.toObject(),
      method: this.method,
      url: this.url,
      body: this.body ? serialize(this.headers.contentType!, this.body) : undefined,
      timeout: this.timeout
    });

    // Create a response
    const response = new HttpResponse({
      statusCode: responseObject.statusCode,
      headers: new HttpHeaders(responseObject.headers),
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

function isRefreshTokenRequestInProgress() {
  return refreshTokenRequestInProgress === true;
}

export interface KinveyHttpRequestConfig extends HttpRequestConfig {
  headers?: KinveyHttpHeaders;
  auth?: KinveyHttpAuth;
}

export class KinveyHttpRequest extends HttpRequest {
  public headers: KinveyHttpHeaders;

  constructor(config: KinveyHttpRequestConfig) {
    super(config);
    this.headers = new KinveyHttpHeaders(config.headers);

    if (config.auth) {
      this.headers.setAuthorization(config.auth);
    }
  }

  async execute(retry = true): Promise<HttpResponse> {
    try {
      return super.execute();
    } catch (error) {
      if (retry) {
        // Received an InvalidCredentialsError
        if (error instanceof InvalidCredentialsError) {
          // Queue the request if a refresh token request is in progress
          if (isRefreshTokenRequestInProgress()) {
            return REQUEST_QUEUE.add(() => this.execute(false).catch(() => Promise.reject(error)));
          }

          const activeSession = getSession();
          const socialIdentity = (activeSession && activeSession._socialIdentity) || {};
          const micIdentityKey = Object.keys(socialIdentity)
            .find(sessionKey => socialIdentity[sessionKey].identity === 'kinveyAuth');

          if (micIdentityKey) {
            const micIdentity = socialIdentity[micIdentityKey];

            if (micIdentity && micIdentity.refresh_token && micIdentity.redirect_uri) {
              try {
                // Pause the request queue
                REQUEST_QUEUE.pause();
                refreshTokenRequestInProgress = true;

                // Refresh the session
                const refreshRequest = new KinveyHttpRequest({
                  method: HttpRequestMethod.POST,
                  headers: new KinveyHttpHeaders({
                    'Content-Type': () => 'application/x-www-form-urlencoded',
                    Authorization: () => {
                      const credentials = Base64.encode(`${micIdentity.client_id}:${getAppSecret()}`);
                      return `Basic ${credentials}`;
                    }
                  }),
                  url: formatKinveyAuthUrl('/oauth/token'),
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
                  identity: micIdentity.identity,
                  client_id: micIdentity.client_id,
                  redirect_uri: micIdentity.redirect_uri,
                  protocol: getAuthProtocol(),
                  host: getAuthHost()
                });

                // Login the new MIC identity
                const loginRequest = new KinveyHttpRequest({
                  method: HttpRequestMethod.POST,
                  auth: KinveyHttpAuth.App,
                  url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
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
                const request = new KinveyHttpRequest(this);
                const response = await request.execute(false);

                // Start the request queue
                refreshTokenRequestInProgress = false;
                REQUEST_QUEUE.start();

                // Return the response
                return response;
              } catch (error) {
                // TODO: Log error
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

            // Clear data
            Storage.clear(getAppKey());
          } catch (error) {
            // TODO: Log error
          }
        }

        // Start the request queue
        refreshTokenRequestInProgress = false;
        REQUEST_QUEUE.start();
      }

      // Throw the error
      throw error;
    }
  }
}
