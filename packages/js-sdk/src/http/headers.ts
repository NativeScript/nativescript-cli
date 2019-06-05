import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { Base64 } from 'js-base64';
import { KinveyError } from '../errors/kinvey';
import { getAppKey, getAppSecret, getMasterSecret, getApiVersion } from '../kinvey';
import { getSession } from './session';

function byteCount(str: string): number {
  if (str) {
    let count = 0;
    const stringLength = str.length;

    for (let i = 0; i < stringLength; i += 1) {
      const partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

export class HttpHeaders {
  private headers: Map<string, string> = new Map();
  private normalizedNames: Map<string, string> = new Map();

  constructor(headers?: HttpHeaders)
  constructor(headers?: { [name: string]: string | string[] })
  constructor(headers?: { [name: string]: () => string | string[] })
  constructor(headers?: any) {
    if (headers) {
      if (headers instanceof HttpHeaders) {
        this.join(headers);
      } else {
        Object.keys(headers).forEach((name) => {
          this.set(name, headers[name]);
        });
      }
    }
  }

  get contentType() {
    return this.get('Content-Type');
  }

  set contentType(value: string) {
    this.set('Content-Type', value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string): string | undefined {
    return this.headers.get(name.toLowerCase()) || undefined;
  }

  keys(): string[] {
    return Array.from(this.normalizedNames.values());
  }

  set(name: string, value: string | string[]): HttpHeaders
  set(name: string, value: () => string | string[]): HttpHeaders
  set(name: string, value: any): HttpHeaders {
    if (isFunction(value)) {
      return this.set(name, value());
    } else if (isArray(value)) {
      return this.set(name, value.join(','));
    }

    const key = name.toLowerCase();
    this.headers.set(key, value);

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  join(headers: HttpHeaders) {
    headers.keys().forEach((name) => {
      const value = headers.get(name);
      if (value) {
        this.set(name, value);
      }
    });
  }

  delete(name: string): boolean {
    return this.headers.delete(name);
  }

  toPlainObject(): { [name: string]: string } {
    return this.keys()
      .reduce((headers: { [name: string]: string }, header) => {
        const value = this.get(header);
        if (value) {
          headers[header] = value;
        }
        return headers;
    }, {});
  }
}

export enum KinveyHttpAuth {
  All = 'All',
  App = 'App',
  Master = 'Master',
  Session = 'Session',
  SessionOrApp = 'SessionOrApp',
  SessionOrMaster = 'SessionOrMaster'
}

const globalHeaders = new HttpHeaders();

export function getAppVersion() {
  return globalHeaders.get('X-Kinvey-Client-App-Version');
}

export function setAppVersion(appVersion: string) {
  globalHeaders.set('X-Kinvey-Client-App-Version', appVersion);
}

export class KinveyHttpHeaders extends HttpHeaders {
  constructor(headers?: KinveyHttpHeaders)
  constructor(headers?: { [name: string]: string | string[] })
  constructor(headers?: { [name: string]: () => string | string[] })
  constructor(headers?: any) {
    super(headers);

    // Add the Accept header
    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    }

    // Add Content-Type header
    if (!this.has('Content-Type')) {
      this.set('Content-Type', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', String(getApiVersion()));
    }

    // Add global Kinvey headers
    this.join(globalHeaders);
  }

  get requestStart() {
    return this.get('X-Kinvey-Request-Start');
  }

  setAuthorization(auth: KinveyHttpAuth): void {
    const appKey = getAppKey();
    const appSecret = getAppSecret();
    const masterSecret = getMasterSecret();
    const session = getSession();
    let value = '';

    if (auth === KinveyHttpAuth.App) {
      if (!appKey || !appSecret) {
        throw new KinveyError('Missing appKey and/or appSecret to authorize the request.');
      }
      const credentials = Base64.encode(`${appKey}:${appSecret}`);
      value = `Basic ${credentials}`;
    } else if (auth === KinveyHttpAuth.Master) {
      if (!appKey || !masterSecret) {
        throw new KinveyError('Missing appKey and/or masterSecret to authorize the request.');
      }
      const credentials = Base64.encode(`${appKey}:${masterSecret}`);
      value = `Basic ${credentials}`;
    } else if (auth === KinveyHttpAuth.Session) {
      if (!session || !session._kmd || !session._kmd.authtoken) {
        throw new KinveyError('There is no active user to authorize the request.');
      }
      value = `Kinvey ${session._kmd.authtoken}`;
    } else if (auth === KinveyHttpAuth.All) {
      try {
        return this.setAuthorization(KinveyHttpAuth.Session);
      } catch (error) {
        try {
          return this.setAuthorization(KinveyHttpAuth.App);
        } catch (error) {
          return this.setAuthorization(KinveyHttpAuth.Master);
        }
      }
    } else if (auth === KinveyHttpAuth.SessionOrApp) {
      try {
        return this.setAuthorization(KinveyHttpAuth.Session);
      } catch (error) {
        return this.setAuthorization(KinveyHttpAuth.App);
      }
    } else if (auth === KinveyHttpAuth.SessionOrMaster) {
      try {
        return this.setAuthorization(KinveyHttpAuth.Session);
      } catch (error) {
        return this.setAuthorization(KinveyHttpAuth.Master);
      }
    }

    this.set('Authorization', value);
  }

  setCustomRequestProperties(properties: {}): void {
    const customRequestPropertiesVal = JSON.stringify(properties);

    if (!isEmpty(customRequestPropertiesVal)) {
      const customRequestPropertiesByteCount = byteCount(customRequestPropertiesVal);

      if (customRequestPropertiesByteCount >= 2000) {
        throw new Error(
          `The custom properties are ${customRequestPropertiesByteCount} bytes.` +
          'It must be less then 2000 bytes.');
      }

      this.set('X-Kinvey-Custom-Request-Properties', customRequestPropertiesVal);
    } else {
      this.delete('X-Kinvey-Custom-Request-Properties');
    }
  }
}
