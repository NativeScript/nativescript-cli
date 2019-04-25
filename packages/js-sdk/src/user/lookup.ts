import { Observable } from 'rxjs';
import { Query } from '../query';
import { KinveyError } from '../errors/kinvey';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyHttpAuth, KinveyBaasNamespace } from '../http';

export interface LookupOptions {
  timeout?: number;
}

export function lookup(query?: Query, options: LookupOptions = {}) {
  const stream = Observable.create(async (observer: any) => {
    try {
      if (query && !(query instanceof Query)) {
        throw new KinveyError('Invalid query. It must be an instance of the Query class.');
      }

      const request = new KinveyHttpRequest({
        method: HttpRequestMethod.POST,
        auth: KinveyHttpAuth.SessionOrMaster,
        url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/_lookup'),
        body: query ? query.filter : undefined,
        timeout: options.timeout
      });
      const response = await request.execute();
      observer.next(response.data);
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  });
  return stream;
}
