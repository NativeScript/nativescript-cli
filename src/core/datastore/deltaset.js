import { format } from 'url';
import { KinveyRequest, RequestMethod, AuthType } from '../request';
import { Client } from '../client';
import {
  InvalidCachedQuery,
  ParameterValueOutOfRangeError,
  ResultSetSizeExceededError,
  MissingConfigurationError
} from '../errors';
import { buildCollectionUrl } from './utils';
import { getCachedQuery } from './querycache';

export function deltaSet(collectionName, query, options) {
  return getCachedQuery(collectionName, query)
    .then((cachedQuery) => {
      if (!cachedQuery || !cachedQuery.lastRequest) {
        throw new InvalidCachedQuery();
      }

      const client = Client.sharedInstance();
      const request = new KinveyRequest({
        authType: AuthType.Default,
        method: RequestMethod.GET,
        url: format({
          protocol: client.apiProtocol,
          host: client.apiHost,
          pathname: buildCollectionUrl(collectionName, null, '_deltaset'),
          query: { since: cachedQuery.lastRequest }
        }),
        query,
        timeout: options.timeout,
        followRedirect: options.followRedirect,
        cache: options.cache,
        properties: options.properties,
        skipBL: options.skipBL,
        trace: options.trace,
        client
      });
      return request.execute()
        .catch((error) => {
          if (error instanceof ParameterValueOutOfRangeError
          || error instanceof ResultSetSizeExceededError
          || error instanceof MissingConfigurationError) {
            throw new InvalidCachedQuery();
          }

          throw error;
        });
    });
}
