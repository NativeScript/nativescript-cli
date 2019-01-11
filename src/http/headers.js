import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import KinveyError from '../errors/kinvey';

const X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';
const X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER = 'X-Kinvey-Custom-Request-Properties';

function isNotString(val) {
  return !isString(val);
}

export class Headers {
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

  get contentType() {
    return this.get('Content-Type');
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

    if ((!isString(value) && !isArray(value) && !isFunction(value))
      || (isArray(value) && value.some(isNotString))) {
      throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
    }

    const key = name.toLowerCase();

    if (isArray(value)) {
      this.headers.set(key, value.join(','));
    } else if (isFunction(value)) {
      const val = value();
      return this.set(name, val);
    } else {
      this.headers.set(key, value);
    }

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  join(headers) {
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

function byteCount(str) {
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

export class KinveyHeaders extends Headers {
  constructor(headers) {
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
      this.set('X-Kinvey-Api-Version', '4');
    }
  }

  get requestStart() {
    return this.get(X_KINVEY_REQUEST_START_HEADER);
  }

  get customRequestProperties() {
    return this.get(X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER);
  }

  set customRequestProperties(properties) {
    const customRequestPropertiesVal = JSON.stringify(properties);

    if (!isEmpty(customRequestPropertiesVal)) {
      const customRequestPropertiesByteCount = byteCount(customRequestPropertiesVal);

      if (customRequestPropertiesByteCount >= 2000) {
        throw new KinveyError(
          `The custom properties are ${customRequestPropertiesByteCount} bytes.` +
          'It must be less then 2000 bytes.',
          'Please remove some custom properties.');
      }

      this.set(X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER, customRequestPropertiesVal);
    } else {
      this.delete('X-Kinvey-Custom-Request-Properties');
    }
  }
}
