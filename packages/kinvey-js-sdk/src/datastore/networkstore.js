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

  async find(query) {
    const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.GET, url);
    const response = await execute(request);
    return response.data;
  }

  async count(query) {
    const url = formatKinveyBaasUrl(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.GET, url);
    const response = await execute(request);
    return response.data;
  }

  async findById(id) {
    const url = formatKinveyBaasUrl(`${this.pathname}/${id}`);
    const request = createRequest(RequestMethod.GET, url);
    const response = await execute(request);
    return response.data;
  }

  async create(doc) {
    const url = formatKinveyBaasUrl(this.pathname);
    const request = createRequest(RequestMethod.POST, url, doc);
    const response = await execute(request);
    return response.data;
  }

  async update(doc) {
    const url = formatKinveyBaasUrl(this.pathname);
    const request = createRequest(RequestMethod.PUT, url, doc);
    const response = await execute(request);
    return response.data;
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
