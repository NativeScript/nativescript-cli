import { getConfig } from 'kinvey-app';
import { KinveyObservable } from 'kinvey-observable';
import { get as getSession } from 'kinvey-session';
import * as Live from 'kinvey-live';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from 'kinvey-http';

const NAMESPACE = 'appdata';

export function createRequest(method, url, body) {
  return new KinveyRequest({
    method,
    headers: {
      Authorization: Auth.Session
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

  get pathname() {
    return `/${NAMESPACE}/${this.appKey}/${this.collectionName}`;
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
      const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
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
      const url = formatKinveyBaasUrl(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
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

  findById(id, rawResponse = false) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
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

  async create(doc, rawResponse = false) {
    const url = formatKinveyBaasUrl(this.pathname);
    const request = createRequest(RequestMethod.POST, url, doc);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc, rawResponse = false) {
    const url = formatKinveyBaasUrl(`${this.pathname}/${doc._id}`);
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
    const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.DELETE, url);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id, rawResponse = false) {
    const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
    const request = createRequest(RequestMethod.DELETE, url);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async subscribe(receiver) {
    const { device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyBaasUrl(`${this.pathname}/_subscribe`),
      body: { deviceId: device.id }
    });
    await request.execute();
    Live.subscribeToChannel(this.channelName, receiver);
    Live.subscribeToChannel(this.personalChannelName, receiver);
    return this;
  }

  async unsubscribe() {
    const { device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyBaasUrl(`${this.pathname}/_unsubscribe`),
      body: { deviceId: device.id }
    });
    await request.execute();
    Live.unsubscribeFromChannel(this.channelName);
    Live.unsubscribeFromChannel(this.personalChannelName);
    return this;
  }
}
