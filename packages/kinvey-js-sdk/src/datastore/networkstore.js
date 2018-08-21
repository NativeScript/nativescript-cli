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

  create(doc) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(this.pathname);
      const request = createRequest(RequestMethod.POST, url, doc);
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

  update(doc) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(this.pathname);
      const request = createRequest(RequestMethod.PUT, url, doc);
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

  remove(query) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.DELETE, url);
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

  removeById(id) {
    const stream = KinveyObservable.create(async (observer) => {
      const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
      const request = createRequest(RequestMethod.DELETE, url);
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
}
