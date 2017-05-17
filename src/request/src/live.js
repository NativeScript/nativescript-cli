import Promise from 'es6-promise';
import PubNub from 'pubnub';
import url from 'url';
import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';

import { KinveyObservable, isDefined } from 'src/utils';
import { KinveyError } from 'src/errors';
import Client from 'src/client';
import { User } from 'src/entity';
import { AuthType, KinveyRequest } from './network';
import { RequestMethod } from './request';

const subscriptions = new Map();

class LiveServiceSubscription {
  constructor(collection, pubnubConfig, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    this.collection = collection;
    this.pubnub = new PubNub({
      publishKey: pubnubConfig.publishKey,
      subscribeKey: pubnubConfig.subscribeKey,
      authKey: pubnubConfig.authKey
    });
    this.client = options.client || Client.sharedInstance();
  }

  subscribe(channelGroups = [], options = {}) {
    if (isArray(channelGroups) === false) {
      channelGroups = [channelGroups];
    }

    // Subscribe to the collection for real time
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/appdata/${this.client.appKey}/${this.collection}/_subscribe`
      }),
      body: { deviceId: this.client.deviceId },
      client: this.client,
      timeout: options.timeout,
      properties: options.properties
    });
    return request.execute()
      .then(() => {
        const stream = KinveyObservable.create((observer) => {
          // Create PubNub listener
          const listener = {
            status(event) {
              observer.status(event);
            },
            message(event) {
              // var channelName = event.channel; // The channel for which the message belongs
              // var channelGroup = event.subscription; // The channel group or wildcard subscription match (if exists)
              // var pubTT = event.timetoken; // Publish timetoken
              // var msg = event.message; // The Payload
              observer.next(event.message);
            },
            presence(event) {
              observer.presence(event);
            }
          };

          // Add listener to PubNub
          this.pubnub.addListener(listener);

          // Subscribe to channel group on PubNub
          this.pubnub.subscribe({
            channelGroups: [channelGroups]
          });

          this.unsubscribe = (options = {}) => {
            const request = new KinveyRequest({
              method: RequestMethod.POST,
              authType: AuthType.Session,
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: `/appdata/${this.client.appKey}/${this.collection}/_unsubscribe`
              }),
              body: { deviceId: this.client.deviceId },
              client: this.client,
              timeout: options.timeout,
              properties: options.properties
            });
            return request.execute()
              .then(() => {
                // Remove the listener
                this.pubnub.removeListener(listener);

                // Unsubscribe from the channel groups
                this.pubnub.unsubscribe({
                  channelGroups: channelGroups
                });

                // Complete the stream
                observer.complete();
              });
          };
        });

        return stream;
      });
  }
}

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
