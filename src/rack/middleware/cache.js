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

  handle(request) {
    return super.handle(request).then(() => {
      const method = request.method;
      const query = request.query;
      const data = request.data;
      const db = new DB(request.appKey, this.adapters);
      let promise;

      if (method === HttpMethod.GET) {
        if (request.entityId) {
          if (request.entityId === '_count') {
            promise = db.count(request.collectionName, query);
          } else if (request.entityId === '_group') {
            promise = db.group(request.collectionName, data);
          } else {
            promise = db.findById(request.collectionName, request.entityId);
          }
        } else {
          promise = db.find(request.collectionName, query);
        }
      } else if (method === HttpMethod.POST || method === HttpMethod.PUT) {
        promise = db.save(request.collectionName, data);
      } else if (method === HttpMethod.DELETE) {
        if (request.entityId) {
          promise = db.removeById(request.collectionName, request.entityId);
        } else {
          promise = db.remove(request.collectionName, query);
        }
      }

      return promise.then(result => {
        let statusCode = StatusCode.Ok;

        if (method === HttpMethod.POST) {
          statusCode = StatusCode.Created;
        }

        request.response = {
          statusCode: statusCode,
          headers: {},
          data: result
        };

        return request;
      });
    });
  }
}
