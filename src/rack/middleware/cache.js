import { KinveyMiddleware } from '../middleware';
import { DB, DBAdapter } from '../persistence/db';
import { HttpMethod, StatusCode } from '../../enums';

/**
 * @private
 */
export class CacheMiddleware extends KinveyMiddleware {
  constructor(adapters = [DBAdapter.IndexedDB, DBAdapter.WebSQL, DBAdapter.LocalStorage, DBAdapter.Memory]) {
    super('Kinvey Cache Middleware');
    this.adapters = adapters;
  }

  async handle(request) {
    request = await super.handle(request);
    const method = request.method;
    const query = request.query;
    const data = request.data;
    const db = new DB(request.appKey, this.adapters);
    let result;

    if (method === HttpMethod.GET) {
      if (request.entityId) {
        if (request.entityId === '_count') {
          result = await db.count(request.collectionName, query);
        } else if (request.entityId === '_group') {
          result = await db.group(request.collectionName, data);
        } else {
          result = await db.findById(request.collectionName, request.entityId);
        }
      } else {
        result = await db.find(request.collectionName, query);
      }
    } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
      result = await db.save(request.collectionName, data);
    } else if (method === HttpMethod.DELETE) {
      if (request.entityId) {
        result = await db.removeById(request.collectionName, request.entityId);
      } else {
        result = await db.remove(request.collectionName, query);
      }
    }

    request.response = {
      statusCode: method === HttpMethod.POST ? StatusCode.Created : StatusCode.Ok,
      headers: {},
      data: result
    };

    return request;
  }
}
