import { RequestProperties } from '../src/requests/properties';
const properties = new RequestProperties();

export class CustomRequestProperties {
  static properties() {
    return properties.toJSON();
  }

  static property(name) {
    return properties.getProperty(name);
  }

  static setProperties(properties) {
    CustomRequestProperties.clear();
    CustomRequestProperties.addProperties(properties);
  }

  static setProperty(name, value) {
    const properties = {};
    properties[name] = value;
    CustomRequestProperties.addProperties(properties);
  }

  static addProperties(properties) {
    properties.addProperties(properties);
    return this;
  }

  static clear() {
    properties.clear();
    return this;
  }

  static clearProperty(name) {
    properties.clearProperty(name);
    return this;
  }
}
