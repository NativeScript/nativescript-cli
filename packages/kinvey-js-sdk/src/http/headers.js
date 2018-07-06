import isArray from 'lodash/isArray';
import isString from 'lodash/isString';

const X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';

function isNotString(val) {
  return !isString(val);
}

/**
 * @private
 */
export default class Headers {
  constructor(headers) {
    this.headers = new Map();
    this.normalizedNames = new Map();

    if (headers) {
      if (headers instanceof Headers) {
        headers.keys().forEach((header) => {
          const value = headers.get(header);
          this.set(header, value);
        });
      } else {
        Object.keys(headers).forEach((header) => {
          const value = headers[header];
          this.set(header, value);
        });
      }
    }
  }

  has(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.has(name.toLowerCase());
  }

  get(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.get(name.toLowerCase());
  }

  keys() {
    return Array.from(this.normalizedNames.values());
  }

  set(name, value) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    if ((!isString(value) && !isArray(value))
      || (isArray(value) && value.some(isNotString))) {
      throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
    }

    const key = name.toLowerCase();

    if (isArray(value)) {
      this.headers.set(key, value.join(','));
    } else {
      this.headers.set(key, value);
    }

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  delete(name) {
    if (!isString(name)) {
      throw new Error('Please provide a name. Name must be a string.');
    }

    return this.headers.delete(name.toLowerCase());
  }

  toObject() {
    return this.keys().reduce((headers, header) => {
      // eslint-disable-next-line no-param-reassign
      headers[header] = this.get(header);
      return headers;
    }, {});
  }
}

/**
 * @private
 */
export class KinveyHeaders extends Headers {
  constructor(headers) {
    super(headers);

    // Add the Accept header
    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', '4');
    }
  }

  get requestStart() {
    return this.get(X_KINVEY_REQUEST_START_HEADER);
  }

  setAuthorization(info) {
    if (!info || !isString(info.scheme)) {
      throw new Error('Please provide valid authorization info. The authorization info must have a scheme that is a string.');
    }

    let { credentials } = info;

    if (isString(info.username) && isString(info.password)) {
      credentials = Buffer.from(`${info.username}:${info.password}`).toString('base64');
    }

    if (!credentials) {
      throw new Error('Please provide valid authorization info. The authorization info must contain either a username and password or credentials.')
    }

    this.set('Authorization', `${info.scheme} ${credentials}`);
    return this;
  }

  setAppAuthorization(appKey, appSecret) {
    if (!isString(appKey) || !isString(appSecret)) {
      throw new Error('Please provide a valid appKey and appSecret. The appKey and appSecret must be a string.');
    }

    return this.setAuthorization({
      scheme: 'Basic',
      username: appKey,
      password: appSecret
    });
  }

  setSessionAuthorization(authtoken) {
    if (!authtoken || !isString(authtoken)) {
      throw new Error('Please provide a valid auth token. The auth token must be a string.');
    }

    return this.setAuthorization({
      scheme: 'Kinvey',
      credentials: authtoken
    });
  }
}
