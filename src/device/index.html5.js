import { get as getConfig } from '../kinvey/config';
import { uuidv4 } from './utils';

// eslint-disable-next-line import/prefer-default-export
export default function get() {
  const { appKey } = getConfig();
  const key = `${appKey}.deviceId`;
  let id = window.localStorage.getItem(key);

  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(key, id);
  }

  return id;
}

