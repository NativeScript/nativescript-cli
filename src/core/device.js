const KinveyError = require('./errors').KinveyError;
const Emitter = require('tiny-emitter');
const Request = require('./request').Request;
const WritePolicy = require('./enums').WritePolicy;
const HttpMethod = require('./enums').HttpMethod;
const User = require('./models/user');
const Client = require('./client');
const Auth = require('./auth');
const assign = require('lodash/object/assign');
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const sharedInstanceSymbol = Symbol();

class Device extends Emitter {
  constructor(options = {}) {
    this.googleProjectId = options.googleProjectId;
  }

  get os() {
    let name = 'mobileweb';
    let version;

    if (this.isCordova()) {
      name = global.device.platform;
      version = global.device.version;
    } else if (this.isTitanium()) {
      name = global.Titanium.Platform.getName() === 'iPhone OS' ? 'ios' : global.Titanium.Platform.getName();
      version = global.Titanium.Platform.getVersion();
    }

    return {
      name: name.toLowerCase(),
      version: version
    };
  }

  get platform() {
    let name;
    let version;

    if (this.isCordova()) {
      name = 'cordova';
      version = global.device.cordova;
    } else if (this.isHTML()) {
      const userAgent = global.navigator.userAgent.toLowerCase();
      const rChrome = /(chrome)\/([\w]+)/;
      const rFirefox = /(firefox)\/([\w.]+)/;
      const rIE = /(msie) ([\w.]+)/i;
      const rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
      const rSafari = /(safari)\/([\w.]+)/;
      const browser = rChrome.exec(userAgent) || rFirefox.exec(userAgent) || rIE.exec(userAgent) || rOpera.exec(userAgent) || rSafari.exec(userAgent) || [];
      name = browser[1];
      version = browser[2];
    } else if (this.isNode()) {
      name = global.process.title;
      version = global.process.version;
    } else if (this.isTitanium()) {
      name = 'titanium';
      version = global.Titanium.getVersion();
    }

    return {
      name: name.toLowerCase(),
      version: version
    };
  }

  getId() {
    if (this.id) {
      return Promise.resolve(this.id);
    }

    const promise = new Promise((resolve, reject) => {
      const platform = this.platform;

      if (this.isCordova()) {
        if (typeof global.PushNotification === 'undefined') {
          return reject(new KinveyError('The cordova push module is not installed.'));
        }

        const push = global.PushNotification.init({
          android: {
            senderId: this.googleProjectId
          },
          ios: {
            alert: true,
            badge: true,
            sound: true
          }
        });

        push.on('registration', function(data) {
          this.id = data.registrationId;
          resolve(this.id);
        });

        push.on('notification', data => {
          this.emit(notificationEvent, data);
        });

        push.on('error', function(err) {
          reject(new KinveyError('Failed to retrieve device id.', err));
        });
      } else if (this.isTitanium()) {
        if (platform.name === 'ios') {
          if (platform.version.split('.')[0] >= 8) {
            global.Titanium.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {
              global.Titanium.App.iOS.removeEventListener('usernotificationsettings', registerForPush);
              global.Titanium.Network.registerForPushNotifications({
                success: function(e) {
                  this.id = e.deviceToken;
                  resolve(this.id);
                },
                error: function(e) {
                  reject(new KinveyError('Failed to retrieve device id.', e.error));
                },
                callback: data => {
                  this.emit(notificationEvent, data);
                }
              });
            });

            // Register notification types
            global.Titanium.App.iOS.registerUserNotificationSettings({
              types: [
                global.Titanium.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
                global.Titanium.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
                global.Titanium.App.iOS.USER_NOTIFICATION_TYPE_BADGE
              ]
            });
          } else {
            global.Titanium.Network.registerForPushNotifications({
              types: [
                global.Titanium.Network.NOTIFICATION_TYPE_ALERT,
                global.Titanium.Network.NOTIFICATION_TYPE_SOUND,
                global.Titanium.Network.NOTIFICATION_TYPE_BADGE
              ],
              success: function(e) {
                this.id = e.deviceToken;
                resolve(this.id);
              },
              error: function(e) {
                reject(new KinveyError('Failed to retrieve device id.', e.error));
              },
              callback: data => {
                this.emit(notificationEvent, data);
              }
            });
          }
        } else if (platform.name === 'android') {
          global.CloudPush.retrieveDeviceToken({
            success: function(e) {
              this.id = e.deviceToken;
              resolve(this.id);
            },
            error: function(e) {
              reject(new KinveyError('Failed to retrieve device id.', e.error));
            }
          });

          global.CloudPush.addEventListener('callback', data => {
            this.emit(notificationEvent, data);
          });
        }
      }

      reject(new KinveyError('Unable to retrieve device id.'));
    });

    return promise;
  }

  register(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    if (!this.isCordova() || !this.isTitanium()) {
      return Promise.reject(new KinveyError(`Kinvey currently only supports push notifications on PhoneGap/Cordova and Titanium environments.`));
    }

    const platform = this.platform;
    const promise = Promise.resolve().then(() => {
      if (platform.name !== 'android' || platform.name !== 'ios') {
        return Promise.reject(new KinveyError(`Kinvey currently does not support push notifications on ${platform.name}.`));
      }
    }).then(() => {
      return this.getId();
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('A device id was not provided.');
      }

      User.getActive(options).then(user => {
        const request = new Request({
          auth: user ? Auth.session : Auth.master,
          client: options.client,
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${options.client.appId}/register-device`,
          writePolicy: WritePolicy.Network,
          data: {
            platform: platform.name,
            framework: this.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          }
        });
        return request.execute();
      });
    });

    return promise;
  }

  unregister(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    if (!this.isCordova() || !this.isTitanium()) {
      return Promise.reject(new KinveyError(`Kinvey currently only support push notifications on PhoneGap/Cordova and Titanium environments.`));
    }

    const platform = this.platform;
    const promise = Promise.resolve().then(() => {
      const platform = this.platform;

      if (platform.name !== 'android' || platform.name !== 'ios') {
        return Promise.reject(new KinveyError(`Kinvey currently does not support push notifications on ${platform.name}.`));
      }
    }).then(() => {
      return this.getId();
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('A device id was not provided.');
      }

      User.getActive(options).then(user => {
        const request = new Request({
          auth: user ? Auth.session : Auth.master,
          client: options.client,
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${options.client.appId}/unregister-device`,
          writePolicy: WritePolicy.Network,
          data: {
            platform: platform.name,
            framework: this.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          }
        });
        return request.execute();
      });
    });

    return promise;
  }

  isCordova() {
    try {
      return typeof global.cordova !== 'undefined' && typeof global.device !== 'undefined';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isHTML() {
    try {
      return typeof window !== 'undefined';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isNode() {
    try {
      return Object.prototype.toString.call(global.process) === '[object process]';
    } catch (err) {
      // Catch any errors
    }

    return false;
  }

  isPhoneGap() {
    return this.isCordova();
  }

  isTitanium() {
    return typeof global.Titanium !== 'undefined';
  }

  toJSON() {
    return {
      os: this.os,
      platform: this.platform
    };
  }

  static get NOTIFICATION_EVENT() {
    return notificationEvent;
  }

  static init(options) {
    const device = new Device(options);
    Device[sharedInstanceSymbol] = device;
    return device;
  }

  static sharedInstance() {
    const device = Device[sharedInstanceSymbol];

    if (!device) {
      throw new KinveyError('You have not initialized the device class. Call Device.init() to initialize the device class.');
    }

    return device;
  }
}

Device.init();
module.exports = Device;
