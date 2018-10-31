import { getConfig } from 'kinvey-app';
import { KinveyObservable } from 'kinvey-observable';
import { get as getSession } from 'kinvey-session';
import { Aggregation } from 'kinvey-aggregation';
import * as Live from 'kinvey-live';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from 'kinvey-http';

const NAMESPACE = 'appdata';

export function createRequest(method, url, body) {
  return new KinveyRequest({
    method,
    headers: {
      Authorization: Auth.Session(getSession())
    },
    url,
    body
  });
}

export class NetworkStore {
  constructor(appKey, collectionName) {
    this.appKey = appKey;
    this.collectionName = collectionName;
  }

  /**
   * @deprecated 4.0.0 - Use collectionName instead.
   */
  get collection() {
    return this.collectionName;
  }

  get url() {
    const { appKey } = getConfig();
    return `/${NAMESPACE}/${appKey}/${this.collectionName}`;
  }

  get channelName() {
    return `${this.appKey}.c-${this.collectionName}`;
  }

  get personalChannelName() {
    const session = getSession();
    return `${this.channelName}.u-${session._id}`;
  }

  find(query, rawResponse = false) {
    const stream = KinveyObservable.create(async (observer) => {
      const { api } = getConfig();
      const url = formatKinveyUrl(api.protocol, api.host, this.pathname, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      try {
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

  count(query, rawResponse = false) {
    const stream = KinveyObservable.create(async (observer) => {
      const { api } = getConfig();
      const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      try {
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

  group(aggregation, rawResponse = false) {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        if (!(aggregation instanceof Aggregation)) {
          throw new Error('aggregation must be an instance of Aggregation.');
        }

        const { api } = getConfig();
        const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_group`);
        const request = createRequest(RequestMethod.POST, url, aggregation.toPlainObject());
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

  findById(id, rawResponse = false) {
    const stream = KinveyObservable.create(async (observer) => {
      const { api } = getConfig();
      const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${id}`);
      const request = createRequest(RequestMethod.GET, url);
      try {
        if (!id) {
          throw new Error('No id was provided. A valid id is required.');
        }

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

  async create(doc, rawResponse = false) {
    const { api } = getConfig();
    const url = formatKinveyUrl(api.protocol, api.host, this.pathname);
    const request = createRequest(RequestMethod.POST, url, doc);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc, rawResponse = false) {
    const { api } = getConfig();
    const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${doc._id}`);
    const request = createRequest(RequestMethod.PUT, url, doc);
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

  async remove(query, rawResponse = false) {
    const { api } = getConfig();
    const url = formatKinveyUrl(api.protocol, api.host, this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.DELETE, url);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id, rawResponse = false) {
    const { api } = getConfig();
    const url = formatKinveyUrl(api.protocol, api.host, `${this.pathname}/${id}`);
    const request = createRequest(RequestMethod.DELETE, url);
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
      headers: {
        Authorization: Auth.Session(getSession())
      },
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
      headers: {
        Authorization: Auth.Session(getSession())
      },
      url: formatKinveyUrl(api.protocol, api.host, `${this.pathname}/_unsubscribe`),
      body: { deviceId: device.id }
    });
    await request.execute();
    Live.unsubscribeFromChannel(this.channelName);
    Live.unsubscribeFromChannel(this.personalChannelName);
    return this;
  }
}
