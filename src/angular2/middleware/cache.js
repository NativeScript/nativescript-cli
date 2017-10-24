import { Middleware, RequestMethod, StatusCode } from '../../core/request';
import { isEmpty } from '../../core/utils';
import { Storage } from './storage';
import { Device } from '../device';

export class CacheMiddleware extends Middleware {
  constructor(name = 'PhoneGap Cache Middleware') {
    super(name);
  }

  handle(request) {
    return Device.ready()
      .then(() => {
        const {
          method,
          body,
          appKey,
          collection,
          entityId,
          encryptionKey
        } = request;
        const storage = new Storage(appKey, encryptionKey);
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

        return promise.then((data) => {
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
      });
  }
}
