const HttpMethod = require('./enums').HttpMethod;
const Rack = require('../rack/rack');
const Response = require('./response');
const ResponseType = require('./enums').ResponseType;
const Query = require('./query');
const url = require('url');
const Client = require('./client');
const DataPolicy = require('./enums').DataPolicy;
const StatusCode = require('./enums').StatusCode;
const KinveyError = require('./errors').KinveyError;
const RequestProperties = require('./requestProperties');
const Promise = require('bluebird');
const UrlPattern = require('url-pattern');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const clone = require('lodash/lang/clone');
const indexBy = require('lodash/collection/indexBy');
const reduce = require('lodash/collection/reduce');
const forEach = require('lodash/collection/forEach');
const byteCount = require('./utils/string').byteCount;
const isArray = require('lodash/lang/isArray');
const isFunction = require('lodash/lang/isFunction');
const isString = require('lodash/lang/isString');
const isPlainObject = require('lodash/lang/isPlainObject');
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
const customRequestPropertiesMaxBytes = process.env.KINVEY_MAX_HEADER_BYTES || 2000;
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 10000;
const maxIdsPerRequest = process.env.KINVEY_MAX_IDS || 200;

class Request {
  constructor(options = {}) {
    options = assign({
      method: HttpMethod.GET,
      path: '/',
      query: null,
      data: null,
      auth: null,
      client: Client.sharedInstance(),
      dataPolicy: DataPolicy.LocalFirst,
      responseType: ResponseType.Text,
      timeout: defaultTimeout,
      skipSync: false
    }, options);

    if (!(options.client instanceof Client)) {
      options.client = new Client(result(options.client, 'toJSON', options.client));
    }

    if (options.query && !(options.query instanceof Query)) {
      options.query = new Query(result(options.query, 'toJSON', options.query));
    }

    this.method = options.method;
    this.headers = {};
    this.requestProperties = options.requestProperties;
    this.protocol = options.client.apiProtocol;
    this.host = options.client.apiHost;
    this.path = options.path;
    this.query = options.query;
    this.flags = options.flags;
    this.data = options.data;
    this.responseType = options.responseType;
    this.client = options.client;
    this.auth = options.auth;
    this.dataPolicy = options.dataPolicy;
    this.timeout = options.timeout;
    this.executing = false;
    this.skipSync = options.skipSync;

    const headers = {};
    headers.Accept = 'application/json';
    headers['X-Kinvey-Api-Version'] = process.env.KINVEY_API_VERSION || 3;
    headers['X-Kinvey-Device-Information'] = 'nodejs-sdk v1.9.0';

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
      pathname: this.path
    });
  }

  get body() {
    return this._data;
  }

  set body(body) {
    if (body) {
      const contentTypeHeader = this.getHeader('Content-Type');

      if (!contentTypeHeader) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else {
      this.removeHeader('Content-Type');
    }

    this._data = body;
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

    if (!isString(value)) {
      value = String(value);
    }

    const headers = this.headers;
    headers[header.toLowerCase()] = value;
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

  execute() {
    if (this.executing) {
      return Promise.reject(new KinveyError('The request is already executing.'));
    }

    const promise = Promise.resolve();
    const auth = this.auth;
    this.executing = true;

    return promise.then(() => {
      return isFunction(auth) ? auth(this.client) : auth;
    }).then(authInfo => {
      if (authInfo) {
        // Format credentials
        let credentials = authInfo.credentials;
        if (authInfo.username) {
          credentials = new Buffer(`${authInfo.username}:${authInfo.password}`).toString('base64');
        }

        // Set the header
        this.setHeader('Authorization', `${authInfo.scheme} ${credentials}`);
      }
    }).then(() => {
      if (this.dataPolicy === DataPolicy.LocalOnly) {
        return this.executeLocal().then(response => {
          if (!this.skipSync && this.method !== HttpMethod.GET && response && response.isSuccess()) {
            return this.notifySync(response.data).then(() => {
              return response;
            });
          }

          return response;
        });
      } else if (this.dataPolicy === DataPolicy.LocalFirst) {
        if (this.method !== HttpMethod.GET) {
          const request = new Request({
            method: this.method,
            path: this.path,
            query: this.query,
            auth: this.auth,
            data: this.data,
            client: this.client,
            dataPolicy: DataPolicy.NetworkFirst
          });
          return request.execute().catch(err => {
            const request2 = new Request({
              method: this.method,
              path: this.path,
              query: this.query,
              auth: this.auth,
              data: this.data,
              client: this.client,
              dataPolicy: DataPolicy.LocalOnly
            });
            return request2.execute().then(() => {
              throw err;
            });
          });
        }

        return this.executeLocal().then(response => {
          if (response && !response.isSuccess()) {
            const request = new Request({
              method: this.method,
              path: this.path,
              query: this.query,
              auth: this.auth,
              data: response.data,
              client: this.client,
              dataPolicy: DataPolicy.NetworkFirst
            });
            return request.execute();
          }

          return response;
        });
      } else if (this.dataPolicy === DataPolicy.NetworkOnly) {
        return this.executeNetwork();
      } else if (this.dataPolicy === DataPolicy.NetworkFirst) {
        return this.executeNetwork().then(response => {
          if (response && response.isSuccess()) {
            const request = new Request({
              method: this.method,
              path: this.path,
              query: this.query,
              auth: this.auth,
              data: response.data,
              client: this.client,
              dataPolicy: DataPolicy.LocalOnly
            });

            if (this.method === HttpMethod.GET) {
              request.method = HttpMethod.PUT;
            }

            return request.execute().then(() => {
              return response;
            });
          } else if (this.method === HttpMethod.GET) {
            const request = new Request({
              method: this.method,
              path: this.path,
              query: this.query,
              auth: this.auth,
              data: response.data,
              client: this.client,
              dataPolicy: DataPolicy.LocalOnly
            });
            return request.execute();
          }

          return response;
        });
      }
    }).then(response => {
      if (!response) {
        throw new KinveyError('No response');
      } else if (!response.isSuccess()) {
        const data = response.data || {
          description: 'Error',
          debug: ''
        };
        throw new KinveyError(data.message, data.debug);
      }

      this.response = response;
      return response;
    }).catch(err => {
      throw err;
    }).finally(() => {
      this.executing = false;
    });
  }

  executeLocal() {
    const rack = Rack.cacheRack;
    return rack.execute(this);
  }

  executeNetwork() {
    const rack = Rack.networkRack;
    return rack.execute(this);
  }

  /**
   * {
    _id = 'books',
    documents = {
      '1231uhds089kjhsd0923': {
        operation: 'POST',
        requestProperties: ...
      }
    },
    size: 1
  }
   */
  notifySync(data = []) {
    const pattern = new UrlPattern('/:namespace/:appId/:collection(/)(:id)(/)');
    const matches = pattern.match(this.path);
    const getRequest = new Request({
      method: HttpMethod.GET,
      path: `/${matches.namespace}/${matches.appId}/${syncCollectionName}/${matches.collection}`,
      auth: this.auth,
      client: this.client,
      dataPolicy: DataPolicy.LocalOnly
    });

    const promise = getRequest.execute().catch(() => {
      return new Response(StatusCode.OK, {
        _id: matches.collection,
        documents: {},
        size: 0
      });
    }).then(response => {
      const syncCollection = response.data || {
        _id: matches.collection,
        documents: {},
        size: 0
      };
      const documents = syncCollection.documents;
      let size = syncCollection.size;

      if (!isArray(data)) {
        data = [data];
      }

      forEach(data, item => {
        if (item._id) {
          if (!documents.hasOwnProperty(item._id)) {
            size = size + 1;
          }

          documents[item._id] = {
            request: this.toJSON(),
            lmt: item._kmd ? item._kmd.lmt : null
          };
        }
      });

      syncCollection.documents = documents;
      syncCollection.size = size;

      const updateRequest = new Request({
        method: HttpMethod.PUT,
        path: `/${matches.namespace}/${matches.appId}/${syncCollectionName}/${matches.collection}`,
        auth: this.auth,
        data: syncCollection,
        client: this.client,
        dataPolicy: DataPolicy.LocalOnly,
        skipSync: true
      });
      return updateRequest.execute();
    }).then(() => {
      return null;
    });

    return promise;
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
      path: this.path,
      query: result(this.query, 'toJSON', null),
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

    if (this.dataPolicy === DataPolicy.NetworkFirst && this.method === HttpMethod.GET) {
      const origQuery = this.query;
      this.query = new Query();
      this.query.fields(['_id', '_kmd']);
      this.executing = true;

      return this.executeLocal().then(localResponse => {
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
                    if (networkDocument._kmd && localDocument._kmd && networkDocument._kmd.lmt > localDocument._kmd.lmt) {
                      continue;
                    }
                  }

                  delete networkDocuments[id];
                }
              }

              const ids = Object.keys(networkDocuments);
              const promises = [];
              let i = 0;

              // Batch the requests to retrieve 200 items per request
              while (i < ids.length) {
                const query = new Query(origQuery.toJSON());
                query.contains('_id', ids.slice(i, ids.length > maxIdsPerRequest + i ? maxIdsPerRequest : ids.length));
                const request = new Request({
                  method: this.method,
                  path: this.path,
                  query: query,
                  auth: this.auth,
                  client: this.client,
                  dataPolicy: this.dataPolicy
                });
                promises.push(request.execute());

                i += maxIdsPerRequest;
              }

              // Reduce all the responses into one response
              return Promise.all(promises).then(responses => {
                const initialResponse = new Response(null, null, []);
                return reduce(responses, (result, response) => {
                  result.addHeaders(response.headers);
                  result.data.concat(response.data);
                  return result;
                }, initialResponse);
              }).finally(() => {
                this.executing = false;
                this.query = origQuery;
              });
            }

            return super.execute();
          });
        }

        return super.execute();
      });
    }

    return super.execute();
  }
}

module.exports = {
  Request: Request,
  DeltaSetRequest: DeltaSetRequest
};
