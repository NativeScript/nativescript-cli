const RequestProperties = require('../core/requestProperties');
const requestProperties = new RequestProperties();

class CustomRequestProperties {
  static properties() {
    return requestProperties.properties;
  }

  static property(key) {
    return requestProperties.getProperty(key);
  }

  static setProperties(properties) {
    requestProperties.properties = properties;
    return this;
  }

  static setProperty(key, value) {
    requestProperties.setProperty(key, value);
    return this;
  }

  static addProperties(properties) {
    requestProperties.addProperties(properties);
    return this;
  }

  static clear() {
    requestProperties.clear();
    return this;
  }

  static clearProperty(key) {
    requestProperties.clearProperty(key);
    return this;
  }
}

class ClientAppVersion {
  static stringValue() {
    return requestProperties.appVersion;
  }

  static setVersion() {
    requestProperties.appVersion = arguments;
    return this;
  }

  static clear() {
    requestProperties.clearAppVersion();
  }
}

module.exports = {
  CustomRequestProperties: CustomRequestProperties,
  ClientAppVersion: ClientAppVersion
};
