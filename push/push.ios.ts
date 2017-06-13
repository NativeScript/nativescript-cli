import { Promise } from 'es6-promise';
import { EventEmitter } from 'events';
import { device as Device } from 'platform';
import Client from 'kinvey-js-sdk/dist/client';
import { KinveyError, NotFoundError } from 'kinvey-js-sdk/dist/errors';
import { isDefined } from 'kinvey-js-sdk/dist/utils';
import { User } from 'kinvey-js-sdk/dist/entity';
import { AuthType, CacheRequest, KinveyRequest, RequestMethod } from 'kinvey-js-sdk/dist/request';
const PushPlugin = require('nativescript-push-notifications');

export class Push extends EventEmitter {
    private _client: Client;

    constructor(client: Client) {
        super();
        this.client = client;
    }

    get client() {
        if (isDefined(this._client) === false) {
            return Client.sharedInstance();
        }

        return this._client;
    }

    set client(client) {
        if (isDefined(client) && (client instanceof Client) === false) {
            throw new Error('client must be an instance of Client.');
        }

        this._client = client;
    }

    isSupported() {
        return true;
    }

    onNotification(listener) {
        return (this as any).on('notification', listener);
    }

    onceNotification(listener) {
        return (this as any).once('notification', listener);
     }

    register(options = <any>{}) {
        return new Promise((resolve, reject) => {
            if (this.isSupported() === false) {
                return reject(new KinveyError('Kinvey currently only supports push notifications on iOS and Android platforms.'));
            }

            if (isDefined(PushPlugin) === false) {
                return reject(new KinveyError('NativeScript Push Plugin is not installed.',
                    'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
                    + ' setting up your project.'));
            }

            options.notificationCallbackIOS = (data: any) => {
                (this as any).emit('notification', data);
            };

            PushPlugin.register(options, (token) => {
                if (options.interactiveSettings) {
                    PushPlugin.registerUserNotificationSettings(() => {
                        resolve(token);
                    }, (error) => {
                        // do something with error
                        resolve(token);
                    });
                } else {
                    resolve(token);
                }
            }, reject);
        })
            .then((token) => {
                const activeUser = User.getActiveUser(this.client);

                if (isDefined(token) === false) {
                    throw new KinveyError('Unable to retrieve the device token to register this device for push notifications.');
                }

                if (isDefined(activeUser) === false && isDefined(options.userId) === false) {
                    throw new KinveyError('Unable to register this device for push notifications.',
                        'You must login a user or provide a userId to assign the device token.');
                }

                const request = new KinveyRequest({
                    method: RequestMethod.POST,
                    url: `${this.client.apiHostname}/push/${this.client.appKey}/register-device`,
                    authType: activeUser ? AuthType.Session : AuthType.Master,
                    data: {
                        platform: Device.os.toLowerCase(),
                        framework: 'nativescript',
                        deviceId: token,
                        userId: isDefined(activeUser) ? undefined : options.userId
                    },
                    properties: options.properties,
                    timeout: options.timeout,
                    client: this.client
                });
                return request.execute()
                    .then(() => token);
            })
            .then((token) => {
                const activeUser = User.getActiveUser(this.client);
                let userId = options.userId;

                if (isDefined(activeUser) && isDefined(userId) === false) {
                    userId = activeUser._id;
                }

                const request = new CacheRequest({
                    method: RequestMethod.PUT,
                    url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device`,
                    data: {
                        userId: userId,
                        token: token
                    },
                    client: this.client
                });
                return request.execute()
                    .then(() => token);
            });
    }

    unregister(options = <any>{}) {
        return new Promise((resolve, reject) => {
            const activeUser = User.getActiveUser(this.client);
            const userId = options.userId;

            if (this.isSupported() === false) {
                return reject(new KinveyError('Kinvey currently only supports push notifications on iOS and Android platforms.'));
            }

            if (isDefined(PushPlugin) === false) {
                return reject(new KinveyError('NativeScript Push Plugin is not installed.',
                    'Please refer to http://devcenter.kinvey.com/nativescript/guides/push#ProjectSetUp for help with'
                    + ' setting up your project.'));
            }

            if (isDefined(activeUser) === false && isDefined(userId) === false) {
                throw new KinveyError('Unable to unregister this device for push notifications.',
                    'You must login a user or provide a userId.');
            }

            PushPlugin.unregister(resolve, reject, options);
        })
            .then(() => {
                const activeUser = User.getActiveUser(this.client);
                let userId = options.userId;

                if (isDefined(activeUser) && isDefined(userId) === false) {
                    userId = activeUser._id;
                }

                const request = new CacheRequest({
                    method: RequestMethod.GET,
                    url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device/${userId}`,
                    client: this.client
                });
                return request.execute()
                    .catch((error) => {
                        if (error instanceof NotFoundError) {
                            return {};
                        }

                        throw error;
                    })
                    .then(response => response.data);
            })
            .then((device) => {
                const activeUser = User.getActiveUser(this.client);
                let token;

                if (isDefined(device)) {
                    token = device.token;
                }

                if (isDefined(token) === false) {
                    return null;
                }

                const request = new KinveyRequest({
                    method: RequestMethod.POST,
                    url: `${this.client.apiHostname}/push/${this.client.appKey}/unregister-device`,
                    authType: isDefined(activeUser) ? AuthType.Session : AuthType.Master,
                    data: {
                        platform: Device.os.toLowerCase(),
                        framework: 'nativescript',
                        deviceId: token,
                        userId: isDefined(activeUser) ? undefined : options.userId
                    },
                    properties: options.properties,
                    timeout: options.timeout,
                    client: this.client
                });
                return request.execute()
                    .then(response => response.data);
            })
            .then(() => {
                const activeUser = User.getActiveUser(this.client);
                let userId = options.userId;

                if (isDefined(activeUser) && isDefined(userId) === false) {
                    userId = activeUser._id;
                }

                const request = new CacheRequest({
                    method: RequestMethod.DELETE,
                    url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device/${userId}`,
                    client: this.client
                });
                return request.execute()
                    .catch((error) => {
                        if (error instanceof NotFoundError) {
                            return {};
                        }

                        throw error;
                    })
                    .then(() => null);
            });
    }
}
