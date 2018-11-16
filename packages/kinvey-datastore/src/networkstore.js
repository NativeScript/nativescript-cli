import { getConfig } from 'kinvey-app';
import { KinveyObservable } from 'kinvey-observable';
import { get as getSession } from 'kinvey-session';
import { Aggregation } from 'kinvey-aggregation';
import * as Live from 'kinvey-live';
import { Query } from 'kinvey-query';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from 'kinvey-http';
import { KinveyError } from 'kinvey-errors';
import isArray from 'lodash/isArray';

const NAMESPACE = 'appdata';

export function createRequest(method, url, body) {
  return new KinveyRequest({
    method,
    auth: Auth.Session,
    url,
    body
  });
}

export class NetworkStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * @deprecated 4.0.0 - Use collectionName instead.
   */
  get collection() {
    return this.collectionName;
  }

  get pathname() {
    const { appKey } = getConfig();
    return `/${NAMESPACE}/${appKey}/${this.collectionName}`;
  }

  get channelName() {
    const { appKey } = getConfig();
    return `${appKey}.c-${this.collectionName}`;
  }

  get personalChannelName() {
    const session = getSession();
    return `${this.channelName}.u-${session._id}`;
  }

  find(query, options = {}) {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        const { api } = getConfig();
        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL,
          kinveyFileTTL,
          kinveyFileTLS,
        } = options;
        const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS });
        const url = formatKinveyUrl(api.protocol, api.host, this.pathname, queryObject);
        const request = createRequest(RequestMethod.GET, url);
        request.headers.customRequestProperties = properties;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  count(query, options = {}) {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        const { api } = getConfig();
        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL
        } = options;
        const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
        const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_count`, queryObject);
        const request = createRequest(RequestMethod.GET, url);
        request.headers.customRequestProperties = properties;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data.count);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  group(aggregation, options = {}) {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        if (!(aggregation instanceof Aggregation)) {
          throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
        }

        const { api } = getConfig();
        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL
        } = options;
        const queryObject = {};
        const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_group`, queryObject);
        const request = createRequest(RequestMethod.POST, url, aggregation.toPlainObject());
        request.headers.customRequestProperties = properties;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  findById(id, options = {}) {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        // if (!id) {
        //   throw new Error('No id was provided. A valid id is required.');
        // }

        if (id) {
          const { api } = getConfig();
          const {
            rawResponse = false,
            timeout,
            properties,
            trace,
            skipBL,
            kinveyFileTTL,
            kinveyFileTLS,
          } = options;
          const queryObject = { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS };
          const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${id}`, queryObject);
          const request = createRequest(RequestMethod.GET, url);
          request.headers.customRequestProperties = properties;
          const response = await request.execute();

          if (rawResponse === true) {
            observer.next(response);
          } else {
            observer.next(response.data);
          }
        } else {
          observer.next(undefined);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  async create(doc, options = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to create an array of entities.', 'Please create entities one by one.');
    }

    const { api } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyUrl(api.protocol, api.host, this.pathname, queryObject);
    const request = createRequest(RequestMethod.POST, url, doc);
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc, options = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities.', 'Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.', doc);
    }

    const { api } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${doc._id}`, queryObject);
    const request = createRequest(RequestMethod.PUT, url, doc);
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query, options = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { api } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
    const url = formatKinveyUrl(api.protocol, api.host, this.pathname, queryObject);
    const request = createRequest(RequestMethod.DELETE, url);
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id, options = {}) {
    const { api } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${id}`, queryObject);
    const request = createRequest(RequestMethod.DELETE, url);
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async subscribe(receiver) {
    const { api, device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_subscribe`),
      body: { deviceId: device.id }
    });
    await request.execute();
    Live.subscribeToChannel(this.channelName, receiver);
    Live.subscribeToChannel(this.personalChannelName, receiver);
    return this;
  }

  async unsubscribe() {
    const { api, device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_unsubscribe`),
      body: { deviceId: device.id }
    });
    await request.execute();
    Live.unsubscribeFromChannel(this.channelName);
    Live.unsubscribeFromChannel(this.personalChannelName);
    return this;
  }
}
