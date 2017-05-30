declare const SAMKeychainQuery, SAMKeychain, kSecAttrAccessibleAlwaysThisDeviceOnly: any;

export class SecureStorage {
  private defaultService = 'kinvey_nativescript_sdk';

  get(key): any {
    if (key === null || key === undefined) {
      throw new Error('A key must be provided.');
    }

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;
    query.account = key;

    try {
      query.fetch();
      return query.password;
    } catch (e) {
      return null;
    }
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

    const accessibility = kSecAttrAccessibleAlwaysThisDeviceOnly;
    SAMKeychain.setAccessibilityType(accessibility);

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;
    query.account = key;
    query.password = value;
    return query.save();
  }

  remove(key): boolean {
    if (key === null || key === undefined) {
      throw new Error('A key must be provided.');
    }

    const query = SAMKeychainQuery.new();
    query.service = this.defaultService;
    query.account = key;

    try {
      return query.deleteItem();
    } catch (e) {
      return false;
    }
  }
}
