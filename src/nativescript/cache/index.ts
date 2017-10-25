import { isDefined, isEmpty } from '../../core/utils';
import { Middleware, RequestMethod, StatusCode } from '../../core/request';
import { Storage as CoreStorage } from '../../core/request/src/middleware/src/storage';
import { sqLite } from './sqlite';

class Storage extends CoreStorage {
  name: string;

  constructor(name: string) {
    super(name);
  }

  loadAdapter() {
    return sqLite.load(this.name)
      .then((adapter) => {
        if (!isDefined(adapter)) {
          return super.loadAdapter();
        }

        return adapter;
      });
  }
}

export class CacheMiddleware extends Middleware {
  constructor(name = 'NativeScript Cache Middleware') {
    super(name);
  }

  handle(request: any) {
    const {
      method,
      body,
      appKey,
      collection,
      entityId,
      encryptionKey
    } = request;
    const storage = new Storage(appKey);
    let promise;

    if (method === RequestMethod.GET) {
      if (entityId) {
        promise = storage.findById(collection, entityId);
      } else {
        promise = storage.find(collection);
      }
    } else if (method === RequestMethod.POST || method === RequestMethod.PUT) {
      if (entityId === '_group') {
        promise = storage.find(collection);
      } else {
        promise = storage.save(collection, body);
      }
    } else if (method === RequestMethod.DELETE) {
      if (!collection) {
        promise = storage.clear();
      } else {
        promise = storage.removeById(collection, entityId);
      }
    }

    return promise
      .then((data) => {
        const response = {
          statusCode: method === 'POST' ? StatusCode.Created : StatusCode.Ok,
          data: data
        };

        if (method === 'POST' && entityId === '_group') {
          response.statusCode = StatusCode.Ok;
        }

        if (!data || isEmpty(data)) {
          response.statusCode = StatusCode.Empty;
        }

        return response;
      })
      .catch(error => ({ statusCode: error.code }))
      .then(response => ({ response: response }));
  }
}

