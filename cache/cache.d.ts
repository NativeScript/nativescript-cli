import { CacheMiddleware as CoreCacheMiddleware } from 'kinvey-js-sdk/dist/request';

export declare class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name: string);
}
