import { KinveyObservable } from '../observable';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from '../http';
import DataStore from './datastore';

const NAMESPACE = 'appdata';

export function createRequest(method, url, body) {
  return new KinveyRequest({
    method,
    auth: Auth.Session,
    url,
    body
  });
}

export default class NetworkStore extends DataStore {
  get pathname() {
    return `/${NAMESPACE}/${this.appKey}/${this.collectionName}`;
  }

  find(query) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      try {
        const response = await execute(request);
        observer.next(response.data);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  count(query) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      try {
        const response = await execute(request);
        observer.next(response.data);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  findById(id) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
      const request = createRequest(RequestMethod.GET, url);
      try {
        const response = await execute(request);
        observer.next(response.data);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  async create(doc) {
    const url = formatKinveyBaasUrl(this.pathname);
    const request = createRequest(RequestMethod.POST, url, doc);
    const response = await execute(request);
    return response.data;
  }

  async update(doc) {
    const url = formatKinveyBaasUrl(`${this.pathname}/${doc._id}`);
    const request = createRequest(RequestMethod.PUT, url, doc);
    const response = await execute(request);
    return response.data;
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query) {
    const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.DELETE, url);
    const response = await execute(request);
    return response.data;
  }

  async removeById(id) {
    const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
    const request = createRequest(RequestMethod.DELETE, url);
    const response = await execute(request);
    return response.data;
  }
}
