import * as utils from 'utils/utils';

declare const com: any;
const Hawk = com.orhanobut.hawk.Hawk;

export class SecureStorage {
  private hawk: any;

  constructor() {
    this.hawk = Hawk.init(utils.ad.getApplicationContext()).build();
  }

  get(key): any {
    if (key === null || key === undefined) {
      throw new Error('A key must be provided.');
    }

     return Hawk.get(key);
  }

  set(key, value): boolean {
    if (key === null || key === undefined) {
      throw new Error('A key must be provided.');
    }

    if (value !== null && typeof value === 'object') {
      value = JSON.stringify(value);
    }

    if (value !== null && typeof value !== 'string') {
      value = String(value);
    }

    return Hawk.put(key, value);
  }

  remove(key): boolean {
    if (key === null || key === undefined) {
      throw new Error('A key must be provided.');
    }

    return Hawk.delete(key);
  }
}
