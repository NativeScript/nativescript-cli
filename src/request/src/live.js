import Promise from 'es6-promise';
import PubNub from 'pubnub';
import UrlPattern from 'url-pattern';
import url from 'url';

import { KinveyObservable, isDefined } from 'src/utils';
import { KinveyError } from 'src/errors';
import CacheRequest from './cache';
import Request from './request';

const subscriptions = new Map();
const registered = new Map();

function register(options = {}) {
  const activeUser = CacheRequest.getActiveUser(options.client);

  // Check if an active user exists
  if (isDefined(activeUser) === false) {
    return Promise.reject(
      new KinveyError('An active user is required to register for real time updates.')
    );
  }

  // Check if the active user is already registered
  if (registered.get(activeUser._id)) {
    return Promise.resolve(activeUser);
  }

  // Register the active user
  return Promise.resolve(activeUser);
}

// function unregister(options = {}) {
//   const activeUser = CacheRequest.getActiveUser(options.client);

//   // Check if an active user exists
//   if (isDefined(activeUser) === false) {
//     return Promise.reject(
//       new KinveyError('An active user is required to unregister from real time updates.')
//     );
//   }

//   // Check if the active user is already registered
//   if (registered.get(activeUser._id) === false) {
//     return Promise.resolve(activeUser);
//   }

//   // Unregister the active user
//   return Promise.resolve(activeUser);
// }

export default class LiveRequest extends Request {
  get url() {
    return super.url;
  }

  set url(urlString) {
    super.url = urlString;
    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || {};
    this.appKey = appKey;
    this.collection = collection;
    this.entityId = entityId;
  }

  execute() {
    return this.subscribe();
  }

  subscribe() {
    return register({ client: this.client })
      .then((user) => {
        const key = { _id: user._id, collection: this.collection };
        const subscription = subscriptions.get(key) || {};
        let stream = subscription.stream;

        if (isDefined(stream) === false) {
          stream = KinveyObservable.create((observer) => {
            const pubnub = new PubNub({
              publishKey: 'demo',
              subscribeKey: 'demo'
            });

            pubnub.addListener({
              status(statusEvent) {
                observer.status(statusEvent);
              },
              message(message) {
                observer.next(message);
              },
              presence(presenceEvent) {
                observer.presence(presenceEvent);
              }
            });

            pubnub.subscribe({
              channels: ['hello_world']
            });
          });

          subscription.stream = stream;
          subscriptions.set(key, subscription);
          return stream;
        }

        return stream;
      });
  }
}
