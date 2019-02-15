import { SecureStorage } from 'nativescript-secure-storage';
import { get as getConfig } from '../kinvey/config';
import { uuidv4 } from './utils';

const secureStorage = new SecureStorage();

// eslint-disable-next-line import/prefer-default-export
export default function get() {
  const { appKey } = getConfig();
  const key = `${appKey}.deviceId`;
  let id = secureStorage.getSync({ key });

  if (!id) {
    id = uuidv4();
    secureStorage.setSync({
      key,
      value: id
    });
  }

  return id;
}

