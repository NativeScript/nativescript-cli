const Properties = require('../core/requests/properties');
const properties = new Properties();

class CustomRequestProperties {
  static properties() {
    return properties.properties;
  }

  static property(key) {
    return properties.getProperty(key);
  }

  static setProperties(properties) {
    properties.properties = properties;
    return this;
  }

  static setProperty(key, value) {
    properties.setProperty(key, value);
    return this;
  }

  static addProperties(properties) {
    properties.addProperties(properties);
    return this;
  }

  static clear() {
    properties.clear();
    return this;
  }

  static clearProperty(key) {
    properties.clearProperty(key);
    return this;
  }
}

class ClientAppVersion {
  static stringValue() {
    return properties.appVersion;
  }

  static setVersion() {
    properties.appVersion = arguments;
    return this;
  }

  static clear() {
    properties.clearAppVersion();
  }
}

module.exports = {
  CustomRequestProperties: CustomRequestProperties,
  ClientAppVersion: ClientAppVersion
};
