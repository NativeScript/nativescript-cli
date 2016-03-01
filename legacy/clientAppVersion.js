import { RequestProperties } from '../src/requests/properties';
const clientAppVersion = new RequestProperties();

export class ClientAppVersion {
  static stringValue() {
    return clientAppVersion.appVersion;
  }

  static setVersion() {
    clientAppVersion.setVersion(arguments);
    return this;
  }

  static clear() {
    clientAppVersion.clearAppVersion();
    return this;
  }
}
