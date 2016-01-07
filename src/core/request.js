const HttpMethod = require('./enums').HttpMethod;
const Rack = require('../rack/rack');
const Response = require('./response');
const ResponseType = require('./enums').ResponseType;
const Query = require('./query');
const url = require('url');
const Client = require('./client');
const DataPolicy = require('./enums').DataPolicy;
const WritePolicy = require('./enums').WritePolicy;
const StatusCode = require('./enums').StatusCode;
const KinveyError = require('./errors').KinveyError;
const BlobNotFoundError = require('./errors').BlobNotFoundError;
const NotFoundError = require('./errors').NotFoundError;
const RequestProperties = require('./requestProperties');
const Promise = require('bluebird');
const Device = require('./device');
const qs = require('qs');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const clone = require('lodash/lang/clone');
const indexBy = require('lodash/collection/indexBy');
const reduce = require('lodash/collection/reduce');
const byteCount = require('./utils/string').byteCount;
const isFunction = require('lodash/lang/isFunction');
const isString = require('lodash/lang/isString');
const isPlainObject = require('lodash/lang/isPlainObject');
const customRequestPropertiesMaxBytes = parseInt(process.env.KINVEY_MAX_HEADER_BYTES, 10) || 2000;
const defaultTimeout = parseInt(process.env.KINVEY_DEFAULT_TIMEOUT, 10) || 10000;
const maxIdsPerRequest = parseInt(process.env.KINVEY_MAX_IDS, 10) || 200;
const apiVersion = parseInt(process.env.KINVEY_API_VERSION, 10) || 3;

class Request {
  constructor(options = {}) {
    options = assign({
      method: HttpMethod.GET,
      pathname: '/',
      query: null,
      flags: null,
      data: null,
      auth: null,
      client: Client.sharedInstance(),
      dataPolicy: DataPolicy.NetworkOnly,
      writePolicy: WritePolicy.Network,
      responseType: ResponseType.Text,
      timeout: defaultTimeout
    }, options);

    if (!(options.client instanceof Client)) {
      options.client = new Client(result(options.client, 'toJSON', options.client));
    }

    this.method = options.method;
    this.headers = {};
    this.requestProperties = options.requestProperties;
    this.protocol = options.client.apiProtocol;
    this.host = options.client.apiHost;
    this.pathname = options.pathname || options.path;
    this.query = options.query;
    this.flags = qs.parse(options.flags);
    this.data = options.data;
    this.responseType = options.responseType;
    this.client = options.client;
    this.auth = options.auth;
    this.dataPolicy = options.dataPolicy;
    this.writePolicy = options.writePolicy;
    this.timeout = options.timeout;
    this.executing = false;

    const headers = {};
    headers.Accept = 'application/json';
    headers['X-Kinvey-Api-Version'] = apiVersion;

    const device = new Device();
    headers['X-Kinvey-Device-Information'] = JSON.stringify(device.toJSON());

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    this.addHeaders(headers);
  }

  get method() {
    return this._method;
  }

  set method(method) {
    if (!isString(method)) {
      method = String(method);
    }

    method = method.toUpperCase();

    switch (method) {
      case HttpMethod.GET:
      case HttpMethod.POST:
      case HttpMethod.PATCH:
      case HttpMethod.PUT:
      case HttpMethod.DELETE:
        this._method = method;
        break;
      default:
        throw new KinveyError('Invalid Http Method. GET, POST, PATCH, PUT, and DELETE are allowed.');
    }
  }

  get requestProperties() {
    return this._requestProperties;
  }

  set requestProperties(requestProperties) {
    if (!(requestProperties instanceof RequestProperties)) {
      requestProperties = new RequestProperties(result(requestProperties, 'toJSON', requestProperties));
    }

    const appVersion = requestProperties.appVersion;

    if (appVersion) {
      this.setHeader('X-Kinvey-Client-App-Version', appVersion);
    } else {
      this.removeHeader('X-Kinvey-Client-App-Version');
    }

    const customRequestProperties = result(requestProperties, 'toJSON', {});
    delete customRequestProperties.appVersion;
    const customRequestPropertiesHeader = JSON.stringify(requestProperties.toJSON());
    const customRequestPropertiesByteCount = byteCount(customRequestPropertiesHeader);

    if (customRequestPropertiesByteCount >= customRequestPropertiesMaxBytes) {
      throw new KinveyError(
        `The custom request properties are ${customRequestPropertiesByteCount} bytes.` +
        `It must be less then ${customRequestPropertiesMaxBytes} bytes.`,
        'Please remove some custom request properties.');
    }

    this.setHeader('X-Kinvey-Custom-Request-Properties', customRequestPropertiesHeader);
    this._requestProperties = requestProperties;
  }

  get url() {
    return url.format({
      protocol: this.protocol,
      host: this.host,
      pathname: this.pathname
    });
  }

  get body() {
    return this.data;
  }

  set body(body) {
    this.data = body;
  }

  get data() {
    return this._data;
  }

  set data(data) {
    if (data) {
      const contentTypeHeader = this.getHeader('Content-Type');
      if (!contentTypeHeader) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      this.removeHeader('Content-Type');
    }

    this._data = data;
  }

  get responseType() {
    return this._responseType;
  }

  set responseType(type) {
    type = type || ResponseType.DOMString;
    let responseType;

    switch (type) {
      case ResponseType.Blob:
        try {
          responseType = new global.Blob() && 'blob';
        } catch (e) {
          responseType = 'arraybuffer';
        }

        break;
      case ResponseType.Document:
        responseType = 'document';
        break;
      case ResponseType.JSON:
        responseType = 'json';
        break;
      default:
        responseType = '';
    }

    this._responseType = responseType;
  }

  get query() {
    return this._query;
  }

  set query(query) {
    this._query = result(query, 'toJSON', query);
  }

  getHeader(header) {
    if (!isString(header)) {
      header = String(header);
    }

    const keys = Object.keys(this.headers);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];

      if (key.toLowerCase() === header.toLowerCase()) {
        return this.headers[key];
      }
    }

    return undefined;
  }

  setHeader(header, value) {
    if (!isString(header)) {
      header = String(header);
    }

    const headers = this.headers;
    headers[header] = value;
    this.headers = headers;
  }

  addHeaders(headers) {
    if (!isPlainObject(headers)) {
      throw new KinveyError('headers argument must be an object');
    }

    const keys = Object.keys(headers);

    keys.forEach((header) => {
      const value = headers[header];
      this.setHeader(header, value);
    });
  }

  removeHeader(header) {
    delete this.headers[header.toLowerCase()];
  }

  clearHeaders() {
    this.headers = {};
  }

  execute() {
    if (this.executing) {
      return Promise.reject(new KinveyError('The request is already executing.'));
    }

    const promise = Promise.resolve();

    this.executing = promise.then(() => {
      return isFunction(this.auth) ? this.auth(this.client) : this.auth;
    }).then(authInfo => {
      if (authInfo) {
        let credentials = authInfo.credentials;
        if (authInfo.username) {
          credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
        }

        this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
      }
    }).then(() => {
      if (this.method === HttpMethod.GET) {
        switch (this.dataPolicy) {
          case DataPolicy.LocalOnly:
            return this.executeLocal();
          case DataPolicy.PreferLocal:
            return this.executeLocal().catch(err => {
              if (err instanceof NotFoundError) {
                return new Response(StatusCode.NotFound, {}, []);
              }

              throw err;
            }).then(response => {
              if (response && !response.isSuccess()) {
                const request = new Request({
                  method: this.method,
                  pathname: this.pathname,
                  query: this.query,
                  auth: this.auth,
                  client: this.client,
                  dataPolicy: DataPolicy.PreferNetwork
                });
                return request.execute();
              }

              return response;
            });
          case DataPolicy.NetworkOnly:
            return this.executeNetwork().then(response => {
              if (response && response.isSuccess()) {
                const request = new Request({
                  method: HttpMethod.PUT,
                  pathname: this.pathname,
                  query: this.query,
                  auth: this.auth,
                  data: response.data,
                  client: this.client,
                  writePolicy: WritePolicy.Local
                });

                return request.execute().then(() => {
                  return response;
                });
              }

              return response;
            });
          case DataPolicy.PreferNetwork:
          default:
            return this.executeNetwork().then(response => {
              if (response && response.isSuccess()) {
                const request = new Request({
                  method: HttpMethod.PUT,
                  pathname: this.pathname,
                  query: this.query,
                  auth: this.auth,
                  data: response.data,
                  client: this.client,
                  writePolicy: WritePolicy.Local
                });

                return request.execute().then(() => {
                  return response;
                });
              }

              const request = new Request({
                method: this.method,
                pathname: this.pathname,
                query: this.query,
                auth: this.auth,
                client: this.client,
                dataPolicy: DataPolicy.LocalOnly
              });
              return request.execute();
            });
        }
      }

      switch (this.writePolicy) {
        case WritePolicy.Local:
          return this.executeLocal();
        case WritePolicy.Network:
        default:
          return this.executeNetwork().then(response => {
            if (response && response.isSuccess()) {
              const request = new Request({
                method: this.method,
                pathname: this.pathname,
                query: this.query,
                auth: this.auth,
                data: response.data,
                client: this.client,
                writePolicy: WritePolicy.Local
              });

              return request.execute().then(() => {
                return response;
              });
            }

            return response;
          });
      }
    }).then(response => {
      if (!response) {
        throw new KinveyError('No response');
      } else if (!response.isSuccess()) {
        const data = response.data || {
          name: 'KinveyError',
          message: 'An error has occurred.',
          debug: '',
          stack: ''
        };

        data.message = data.message || data.description || data.error;

        if (data.name === 'BlobNotFound') {
          throw new BlobNotFoundError(data.message, data.debug);
        } else if (data.name === 'EntityNotFound') {
          throw new NotFoundError(data.message, data.debug);
        }

        throw new KinveyError(data.message, data.debug);
      }

      this.response = response;
      return response;
    }).catch(err => {
      this.response = null;
      throw err;
    }).finally(() => {
      this.executing = false;
    });

    return this.executing;
  }

  executeLocal() {
    const rack = Rack.cacheRack;
    return rack.execute(this.toJSON());
  }

  executeNetwork() {
    const rack = Rack.networkRack;
    return rack.execute(this.toJSON());
  }

  abort() {
    // TODO
    throw new KinveyError('Method not supported');
  }

  toJSON() {
    const json = {
      method: this.method,
      headers: this.headers,
      url: this.url,
      pathname: this.pathname,
      query: this.query,
      flags: this.flags,
      data: this.data,
      responseType: this.responseType,
      timeout: this.timeout
    };

    return clone(json);
  }
}

class DeltaSetRequest extends Request {
  execute() {
    if (this.executing) {
      return Promise.reject(new KinveyError('The request is already executing.'));
    }

    if (this.dataPolicy === DataPolicy.PreferNetwork && this.method === HttpMethod.GET) {
      const promise = Promise.resolve();

      this.executing = promise.then(() => {
        return isFunction(this.auth) ? this.auth(this.client) : this.auth;
      }).then(authInfo => {
        if (authInfo) {
          let credentials = authInfo.credentials;
          if (authInfo.username) {
            credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
          }

          this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
        }
      }).then(() => {
        const origQuery = this.query;
        const query = new Query();
        query.fields(['_id', '_kmd']);
        this.query = query;
        this.executing = true;

        return this.executeLocal().catch(err => {
          if (err instanceof NotFoundError) {
            return new Response(StatusCode.Ok, {}, []);
          }

          throw err;
        }).then(localResponse => {
          if (localResponse && localResponse.isSuccess()) {
            const localDocuments = indexBy(localResponse.data, '_id');

            return this.executeNetwork().then(networkResponse => {
              if (networkResponse && networkResponse.isSuccess()) {
                const networkDocuments = indexBy(networkResponse.data, '_id');

                for (const id in networkDocuments) {
                  if (networkDocuments.hasOwnProperty(id)) {
                    const networkDocument = networkDocuments[id];
                    const localDocument = localDocuments[id];

                    // Push id onto delta set if local document doesn't exist
                    if (networkDocument && !localDocument) {
                      continue;
                    } else if (networkDocument && localDocument) {
                      // Push id onto delta set if lmt differs
                      if (networkDocument._kmd && localDocument._kmd &&
                          networkDocument._kmd.lmt > localDocument._kmd.lmt) {
                        continue;
                      }
                    }

                    delete networkDocuments[id];
                  }
                }

                const networkIds = Object.keys(networkDocuments);
                const promises = [];
                let i = 0;

                // Batch the requests to retrieve 200 items per request
                while (i < networkIds.length) {
                  const query = new Query(result(origQuery, 'toJSON', origQuery));
                  query.contains('_id', networkIds.slice(i, networkIds.length > maxIdsPerRequest + i ?
                                                            maxIdsPerRequest : networkIds.length));

                  const request = new Request({
                    method: this.method,
                    pathname: this.pathname,
                    auth: this.auth,
                    client: this.client,
                    dataPolicy: DataPolicy.PreferNetwork,
                    query: query
                  });

                  if (origQuery) {
                    const query = new Query(result(origQuery, 'toJSON', origQuery));
                    query.contains('_id', networkIds.slice(i, networkIds.length > maxIdsPerRequest + i ?
                                                              maxIdsPerRequest : networkIds.length));
                    request.query = query;
                  }

                  promises.push(request.execute());
                  i += maxIdsPerRequest;
                }

                const localIds = Object.keys(localDocuments);
                i = 0;

                while (i < localIds.length) {
                  const query = new Query(result(origQuery, 'toJSON', origQuery));
                  query.contains('_id', localIds.slice(i, localIds.length > maxIdsPerRequest + i ?
                                                          maxIdsPerRequest : localIds.length));

                  const request = new Request({
                    method: this.method,
                    pathname: this.pathname,
                    auth: this.auth,
                    client: this.client,
                    dataPolicy: DataPolicy.ForceLocal,
                    query: query
                  });

                  promises.push(request.execute());
                  i += maxIdsPerRequest;
                }

                // Reduce all the responses into one response
                return Promise.all(promises).then(responses => {
                  const initialResponse = new Response(StatusCode.Ok, {}, []);
                  return reduce(responses, (result, response) => {
                    if (response.headers) {
                      result.addHeaders(response.headers);
                    }

                    result.data = result.data.concat(response.data);
                    return result;
                  }, initialResponse);
                }).finally(() => {
                  this.executing = false;
                  this.query = origQuery;
                });
              }

              this.executing = false;
              return super.execute();
            });
          }

          this.executing = false;
          return super.execute();
        });
      });

      return this.executing;
    }

    return super.execute();
  }
}

module.exports = {
  Request: Request,
  DeltaSetRequest: DeltaSetRequest
};
