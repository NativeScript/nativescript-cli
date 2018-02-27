declare const SAMKeychainQuery: any;
declare const SAMKeychain: any;
declare const kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: any;

export class SecureStorage {
  private defaultService = 'kinvey_nativescript_sdk';

  get(key): any {
    if (typeof key !== 'string') {
      throw new Error('The key argument must be a string.');
    }

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;

    try {
      query.fetch();
      return query.password;
    } catch (e) {
      return null;
    }
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

    const accessibility = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
    SAMKeychain.setAccessibilityType(accessibility);

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;
    query.account = key;
    query.password = value;
	query.synchronizationMode = SAMKeychainQuerySynchronizationMode.No;
    return query.save();
  }

  remove(key): boolean {
    if (typeof key !== 'string') {
      throw new Error('The key argument must be a string.');
    }

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;

    try {
      return query.deleteItem();
    } catch (e) {
      return false;
    }
  }
}
