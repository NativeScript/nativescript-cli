import * as utils from 'utils/utils';

declare const com: any;
const Hawk = com.orhanobut.hawk.Hawk;

export class SecureStorage {
  private hawk: any;

  constructor() {
    this.hawk = Hawk.init(utils.ad.getApplicationContext()).build();
  }

  get(key): any {
    if (typeof key !== 'string') {
      throw new Error('The key argument must be a string.');
    }

    return Hawk.get(key);
  }

  set(key, value): boolean {
    if (typeof key !== 'string') {
      throw new Error('The key argument must be a string.');
    }

    if (value !== null && value !== undefined && typeof value === 'object') {
      value = JSON.stringify(value);
    }

    if (value !== null && value !== undefined && typeof value !== 'string') {
      value = String(value);
    }

    return Hawk.put(key, value);
  }

  remove(key): boolean {
    if (typeof key !== 'string') {
      throw new Error('The key argument must be a string.');
    }

    return Hawk.delete(key);
  }
}
