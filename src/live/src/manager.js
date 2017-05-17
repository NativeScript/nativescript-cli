import Promise from 'es6-promise';
import assign from 'lodash/assign';
import isString from 'lodash/isString';

import { isDefined } from 'src/utils';
import { KinveyError } from 'src/errors';
import Client from 'src/client';
import { User } from 'src/entity';
import LiveServiceSubscription from './subscription';

const subscriptions = new Map();

export default class LiveServiceManager {
  static subscribe(collection, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    const client = options.client || Client.sharedInstance();
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(
        new KinveyError('An active user is required to register for real time.')
      );
    }

    // Register the user for real time
    return activeUser.registerRealTime(options)
      .then((pubnubConfig) => {
        pubnubConfig = assign({ authKey: activeUser.authtoken }, pubnubConfig);
        const key = collection;
        const collectionSubscriptions = subscriptions.get(key) || [];

        // Subscribe to the collection
        const subscription = new LiveServiceSubscription(collection, pubnubConfig, options);
        const stream = subscription.subscribe(pubnubConfig.userChannelGroup, options);

        // Store the subscription to the collection
        collectionSubscriptions.push(subscription);
        subscriptions.set(key, collectionSubscriptions);

        // Return the stream for the collection
        return stream;
      });
  }

  static unsubscribe(collection, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    const key = collection;
    const collectionSubscriptions = subscriptions.get(key) || [];
    const remainingSubscriptions = [];

    return Promise.all(collectionSubscriptions.map((subscription) => {
      return subscription.unsubscribe(options)
        .catch(() => {
          return remainingSubscriptions.push(subscription);
        });
    }))
      .then(() => {
        subscriptions.set(key, remainingSubscriptions);
        return undefined;
      });
  }
}
