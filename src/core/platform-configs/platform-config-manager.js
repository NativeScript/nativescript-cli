import assign from 'lodash/assign';

import { Log } from '../log';
import { platformConfigs } from './configs';

let platformConfig;

/**
 * @private
 */
export function getPlatformConfig() {
  if (!platformConfig) {
    Log.debug('getPlatformConfig() called before setPlatformConfig()');
    return platformConfigs.base; // this should maybe be a thrown error
  }
  return platformConfig;
}

/**
 * @private
 */
export function setPlatformConfig(platform) {
  platformConfig = assign(platformConfigs.base, platformConfigs[platform] || {});
}
