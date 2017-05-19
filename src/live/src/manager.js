import Promise from 'es6-promise';
import assign from 'lodash/assign';
import isString from 'lodash/isString';

import { isDefined } from 'src/utils';
import { KinveyError, NoActiveUserError } from 'src/errors';
import Client from 'src/client';
import { User } from 'src/entity';
import LiveServiceSubscription from './subscription';

const subscriptions = new Map();
const LiveServiceManager = {
  subscribe(collection, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      return Promise.reject(
        new KinveyError('A collection is required and must be a string.')
      );
    }

    const client = options.client || Client.sharedInstance();
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(
        new NoActiveUserError('An active user is required to register for real time.')
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
  },

  unsubscribe(collection, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      return Promise.reject(
        new KinveyError('A collection is required and must be a string.')
      );
    }

    const key = collection;
    const collectionSubscriptions = subscriptions.get(key) || [];
    const remainingSubscriptions = collectionSubscriptions;

    return Promise.all(collectionSubscriptions.map((subscription) => {
      return subscription.unsubscribe(options)
        .then(() => {
          const index = remainingSubscriptions.indexOf(subscription);
          if (index !== -1) {
            remainingSubscriptions.splice(index, 1);
          }
        });
    }))
      .then(() => {
        subscriptions.set(key, remainingSubscriptions);
        return undefined;
      })
      .catch((error) => {
        subscriptions.set(key, remainingSubscriptions);
        throw error;
      });
  }
};

export default LiveServiceManager;
