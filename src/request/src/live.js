import Promise from 'es6-promise';
import PubNub from 'pubnub';
import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';

import { KinveyObservable, isDefined } from 'src/utils';
import { KinveyError } from 'src/errors';
import Client from 'src/client';
import { User } from 'src/entity';
import { AuthType, KinveyRequest } from './network';
import { RequestMethod } from './request';

const subscriptions = new Map();

export default class LiveServiceManager {
  static subscribe(collection, callbacks = {}, options = {}) {
    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    options = assign({
      client: Client.sharedInstance()
    }, options);

    const next = callbacks.next || callbacks.onNext;
    const error = callbacks.error || callbacks.onError;
    const complete = callbacks.complete || callbacks.onComplete;
    const onStatus = callbacks.status || callbacks.onStatus;
    const presence = callbacks.presence || callbacks.onPresense;
    const client = options.client;
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(
        new KinveyError('An active user is required to register for real time.')
      );
    }

    const key = `${client.deviceId}_${activeUser._id}_${collection}`;
    const subscription = subscriptions.get(key) || {};

    if (isDefined(subscription.stream) === false) {
      // Register the user for real time
      return activeUser.registerRealTime(options)
        .then((pubnubConfig) => {
          return new Promise((resolve) => {
            const stream = KinveyObservable.create((observer) => {
              const pubnub = {
                config: pubnubConfig,
                instance: new PubNub({
                  publishKey: pubnubConfig.publishKey,
                  subscribeKey: pubnubConfig.subscribeKey,
                  authKey: activeUser.authtoken
                }),
                listeners: [],
                subscriptions: []
              };
              const listener = {
                status(event) {
                  if (event.category === 'PNConnectedCategory') {
                    // Subscribe to the collection for real time
                    const request = new KinveyRequest({
                      method: RequestMethod.POST,
                      authType: AuthType.Session,
                      url: url.format({
                        protocol: client.apiProtocol,
                        host: client.apiHost,
                        pathname: `/appdata/${client.appKey}/${collection}/_subscribe`
                      }),
                      body: { deviceId: client.deviceId },
                      client: client,
                      timeout: options.timeout,
                      properties: options.properties
                    });
                    request.execute()
                      .then(() => {
                        // Subscribe to stream
                        const stream = subscription.stream;
                        stream.subscriptions.push(stream.instance.subscribe(next, error, complete, onStatus, presence));
                        subscription.stream = stream;

                        // Set the subscription
                        subscriptions.set(key, subscription);
                        resolve();
                      });
                  }

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

              // Add listener for pubnub
              pubnub.instance.addListener(listener);
              pubnub.listeners.push(listener);

              // Subscribe to channel group on PubNub
              pubnub.instance.subscribe({
                channelGroups: [pubnubConfig.userChannelGroup]
              });

              // Set pubnub
              subscription.pubnub = pubnub;

              // Subscribe to stream
              subscription.stream = {
                instance: stream,
                subscriptions: []
              };

              // Set the subscription
              subscriptions.set(key, subscription);
            });
          });
        });
    }

    // Subscribe to stream
    const stream = subscription.stream;
    stream.subscriptions.push(stream.instance.subscribe(next, error, complete, onStatus, presence));
    subscription.stream = stream;

    // Set the subscription
    subscriptions.set(key, subscription);

    return Promise.resolve();
  }

  static unsubscribe(collection, options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const client = options.client;
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(
        new KinveyError('An active user is required to unregister from real time.')
      );
    }

    const key = `${client.deviceId}_${activeUser._id}_${collection}`;
    const subscription = subscriptions.get(key);

    if (isDefined(subscription)) {
      const request = new KinveyRequest({
        method: RequestMethod.POST,
        authType: AuthType.Session,
        url: url.format({
          protocol: client.apiProtocol,
          host: client.apiHost,
          pathname: `/appdata/${client.appKey}/${collection}/_unsubscribe`
        }),
        body: { deviceId: client.deviceId },
        client: client,
        timeout: options.timeout,
        properties: options.properties
      });
      return request.execute()
        .then(() => {
          const stream = subscription.stream;

          if (isDefined(stream)) {
            stream.subscriptions.forEach((subscription) => {
              subscription.unsubscribe();
            });
          }
        });
    }

    return Promise.resolve();
  }
}
