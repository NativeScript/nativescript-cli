import { get as getConfig } from '../kinvey/config';

// eslint-disable-next-line import/prefer-default-export
export function getKey() {
  const { appKey } = getConfig();
  return `${appKey}.active_user`;
}
