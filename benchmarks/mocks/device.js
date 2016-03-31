import packageJSON from '../../package.json';
import os from 'os';

/**
 * @private
 */
export class DeviceAdapter {
  toJSON() {
    return {
      environment: 'node',
      sdk: {
        name: packageJSON.name,
        version: packageJSON.version
      },
      os: {
        name: os.platform(),
        version: os.release()
      },
      process: {
        name: process.title,
        versions: process.version
      }
    };
  }
}
