import { EventEmitter } from 'events';
import isFunction from 'lodash/isFunction';
import os from 'os';
import nock from 'nock';
import expect from 'expect';
import { NetworkRack } from '../core/request';
import { NotFoundError } from '../core/errors';
import { randomString } from '../core/utils';
import { User } from '../core/user';
import { init } from '../core/kinvey';
import { NodeHttpMiddleware } from '../node/http';
import { PushNotification } from './push';
import { repositoryProvider } from '../core/datastore';

const PUSH_NAMESPACE = process.env.KINVEY_PUSH_NAMESPACE || 'push';

class PushNotificationMock extends PushNotification {
  isSupported() {
    return true;
  }
}
const Push = new PushNotificationMock();

class DevicePlugin {
  get platform() {
    return os.type();
  }
}

class PushNotificationPlugin extends EventEmitter {
  unregister(done) {
    if (isFunction(done)) {
      done();
    }
  }

  static init() {
    return new PushNotificationPlugin();
  }
}

describe('Push', function () {
  const deviceId = randomString();
  let client;

  before(() => {
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  before(() => {
    const username = randomString();
    const password = randomString();
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: username,
      _acl: {
        creator: randomString()
      }
    };

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return User.login(username, password);
  });

  beforeEach(function () {
    global.device = new DevicePlugin();
    global.PushNotification = PushNotificationPlugin;
  });

  describe('register()', function () {
    it('should fail if the platform does not support push notifications', function () {
      class CustomPush extends PushNotificationMock {
        isSupported() {
          return false;
        }
      }

      return new CustomPush()
        .register()
        .catch((error) => {
          expect(error.message).toEqual('Kinvey currently only supports push notifications on iOS and Android platforms.');
        });
    });

    it('should fail if the Cordova Device plugin is not installed', function () {
      delete global.device;

      return Push
        .register()
        .catch((error) => {
          expect(error.message).toEqual('Cordova Device Plugin is not installed.');
          expect(error.debug).toEqual('Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp'
            + ' for help with setting up your project.');
        });
    });

    it('should fail if the PhoneGap Push Notification Plugin is not installed', function () {
      delete global.PushNotification;

      return Push
        .register()
        .catch((error) => {
          expect(error.message).toEqual('PhoneGap Push Notification Plugin is not installed.');
          expect(error.debug).toEqual('Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp'
            + ' for help with setting up your project.');
        });
    });

    it('should fail if an error event is received while retrieving the device id', function () {
      const deviceIdError = new Error('Unable to retrieve device id.');
      class CustomPushNotificationPlugin extends PushNotificationPlugin {
        static init() {
          const plugin = super.init();

          // Emit registration error
          setTimeout(() => {
            plugin.emit('error', deviceIdError);
          }, 250);

          return plugin;
        }
      }
      global.PushNotification = CustomPushNotificationPlugin;

      return Push
        .register()
        .catch((error) => {
          expect(error.message).toEqual('An error occurred registering this device for push notifications.');
          expect(error.debug).toEqual(deviceIdError);
        });
    });

    it('should register the device', function () {
      class CustomPushNotificationPlugin extends PushNotificationPlugin {
        static init() {
          const plugin = super.init();

          // Emit the registration id
          setTimeout(() => {
            plugin.emit('registration', {
              registrationId: deviceId
            });
          }, 250);

          return plugin;
        }
      }
      global.PushNotification = CustomPushNotificationPlugin;

      // Setup API response for registering a device
      nock(client.apiHostname)
        .post(`/${PUSH_NAMESPACE}/${client.appKey}/register-device`, {
          platform: global.device.platform.toLowerCase(),
          framework: 'phonegap',
          deviceId: deviceId
        })
        .reply(204);

      return Push
        .register()
        .then((response) => {
          expect(response).toEqual(deviceId);

          // const user = TestUser.getActiveUser(Push.client);
          // const key = `/${PUSH_NAMESPACE}/${Push.client.appKey}_${user._id}`;
          // expect(localStorage.get(key)).toEqual({ deviceId: deviceId });
        });
    });

    describe('notification', function () {
      it('should emit notification to listeners', function () {
        const notification = {
          title: randomString(),
          message: randomString()
        };

        // Create onNotification spy function
        const onNotificationSpy = expect.createSpy();
        Push.onNotification(onNotificationSpy);

        // Custom Push Notification Plugin
        class CustomPushNotificationPlugin extends PushNotificationPlugin {
          static init() {
            const plugin = super.init();

            // Emit the registration id
            setTimeout(() => {
              plugin.emit('registration', {
                registrationId: deviceId
              });

              // Emmit a notification
              setTimeout(() => {
                plugin.emit('notification', notification);
              }, 250);
            }, 250);

            return plugin;
          }
        }
        global.PushNotification = CustomPushNotificationPlugin;

        // Setup API response for registering a device
        nock(client.apiHostname)
          .post(`/${PUSH_NAMESPACE}/${client.appKey}/register-device`, {
            platform: global.device.platform.toLowerCase(),
            framework: 'phonegap',
            deviceId: deviceId
          })
          .reply(204);

        return Push
          .register()
          .then(() => {
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(expect(onNotificationSpy).toHaveBeenCalledWith(notification));
              }, 1000);
            });
          });
      });
    });
  });

  describe('unregister()', function () {
    before(() => {
      nock(client.apiHostname)
        .post(`/${PUSH_NAMESPACE}/${client.appKey}/unregister-device`, {
          platform: global.device.platform.toLowerCase(),
          framework: 'phonegap',
          deviceId: deviceId
        })
        .reply(204);

      return Push.unregister();
    });

    it('should not fail if the device has not been registered', function () {
      return Push
        .unregister()
        .then((response) => {
          expect(response).toEqual(null);

          // const user = TestUser.getActiveUser(client);
          // const key = `/${PUSH_NAMESPACE}/${client.appKey}_${user._id}`;
          // expect(localStorage.get(key)).toEqual(null);
        });
    });

    it('should unregister the device that has been registered', function () {
      class CustomPushNotificationPlugin extends PushNotificationPlugin {
        static init() {
          const plugin = super.init();

          // Emit the registration id
          setTimeout(() => {
            plugin.emit('registration', {
              registrationId: deviceId
            });
          }, 250);

          return plugin;
        }
      }
      global.PushNotification = CustomPushNotificationPlugin;

      // Setup API response for registering a device
      nock(client.apiHostname)
        .post(`/${PUSH_NAMESPACE}/${client.appKey}/register-device`, {
          platform: global.device.platform.toLowerCase(),
          framework: 'phonegap',
          deviceId: deviceId
        })
        .reply(204);

      // Setup API response for unregistering a device
      nock(client.apiHostname)
        .post(`/${PUSH_NAMESPACE}/${client.appKey}/unregister-device`, {
          platform: global.device.platform.toLowerCase(),
          framework: 'phonegap',
          deviceId: deviceId
        })
        .reply(204);

      return Push
        .register()
        .then(() => Push.unregister())
        .then((response) => {
          expect(response).toEqual(null);

          const user = User.getActiveUser(client);
          return repositoryProvider.getOfflineRepository()
            .then(repo => repo.readById('__device', user._id))
            .catch((error) => {
              expect(error).toBeA(NotFoundError);
              return {};
            })
            .then(response => response.data)
            .then((device) => {
              expect(device).toEqual(null);
            });
        });
    });
  });
});
