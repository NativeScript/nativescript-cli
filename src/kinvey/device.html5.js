import { uuidv4 } from './utils';
import { get as getConfig } from './config';

// eslint-disable-next-line import/prefer-default-export
export function getId() {
  const { appKey } = getConfig();
  const key = `${appKey}.deviceId`;
  let id = window.localStorage.getItem(key);

  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(key, id);
  }

  return id;
}

