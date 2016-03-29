import packageJSON from '../package.json';

/**
 * @private
 */
export class DeviceAdapter {
  toJSON() {
    return {
      device: {
        model: global.device.model
      },
      environment: 'titanium',
      library: {
        name: 'phonegap',
        version: global.device.cordova
      },
      os: {
        name: global.device.platform,
        version: global.device.version
      },
      sdk: {
        name: packageJSON.name,
        version: packageJSON.version
      }
    };
  }
}
