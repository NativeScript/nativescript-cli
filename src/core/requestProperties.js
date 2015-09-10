import Cache from './cache';
import clone from 'lodash/lang/clone';
import merge from 'lodash/object/merge';
const privateRequestPropertiesSymbol = Symbol();
const sharedInstanceSymbol = Symbol();
const requestPropertiesKey = 'requestProperties';
const appVersionKey = 'appVersion';

class PrivateRequestProperties {
  get properties() {
    return this._properties;
  }

  set properties(properties) {
    this._properties = clone(properties, true);
  }

  constructor(properties = {}) {
    const cache = Cache.sharedInstance();
    const savedProperties = cache.get(requestPropertiesKey);

    // Merge the saved properties
    merge(properties, savedProperties);

    // Set the properties
    this.properties = properties;
  }

  addProperties(properties = {}) {
    // Loop through all the keys
    Object.keys(properties).forEach((key) => {
      const value = properties[key];

      // Add the value if it is defined
      if (value) {
        this.properties[key] = value;
      } else { // Else delete the value
        delete this.properties[key];
      }
    });
  }

  clear() {
    // Set properties to an empty object
    this.properties = {};
  }

  clearProperty(key) {
    const properties = this.properties;

    // Delete the value if the properties contains the key
    if (key && properties.hasOwnProperty(key)) {
      delete properties[key];
    }
  }
}

/**
 * Request Properties class
 */
class RequestProperties {
  /**
   * Return the request properties.
   *
   * @return {Object} Request properties
   */
  get properties() {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    return clone(privateRequestProperties.properties);
  }

  /**
   * Set the request properties.
   *
   * @param {Object} properties Request properties
   */
  set properties(properties) {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.properties = properties;
  }

  /**
   * Return the app version request property.
   *
   * @return {String} App version
   */
  get appVersion() {
    return this.getProperty(appVersionKey);
  }

  /**
   * Set the app version request property. The app version can be provided
   * in major.minor.patch format or something specific to your application.
   *
   * @param  {Any} version  App version.
   */
  set appVersion(...version) {
    const major = version[0];
    const minor = version[1];
    const patch = version[2];
    let appVersion = '';

    if (major) {
      appVersion = (major + '').trim();
    }

    if (minor) {
      appVersion = ('.' + minor).trim();
    }

    if (patch) {
      appVersion = ('.' + patch).trim();
    }

    this.setProperty(appVersionKey, appVersion);
  }

  /**
   * THis is the constructor.
   *
   * @param  {Object} properties Request properties
   */
  constructor(properties = {}) {
    this[privateRequestPropertiesSymbol] = new PrivateRequestProperties(properties);
  }

  /**
   * Returns the request property for the key or `undefined` if
   * it has not been set.
   *
   * @param  {String} key Request property key
   * @return {*}          Request property value
   */
  getProperty(key) {
    const properties = this.properties;

    if (key && properties.hasOwnProperty(key)) {
      return properties[key];
    }

    return undefined;
  }

  /**
   * Sets the request property key to the value.
   *
   * @param {String} key   Request property key
   * @param {*}      value Request property value
   */
  setProperty(key, value) {
    const properties = {};
    properties[key] = value;
    this.addProperties(properties);
  }

  /**
   * Adds the properties to the exisiting request properties
   * replacing any that already existed.
   *
   * @param {Object} properties Custom request properties
   */
  addProperties(properties = {}) {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.addProperties(properties);
  }

  /**
   * Clears all the request properties.
   */
  clear() {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.clear();
  }

  /**
   * Clears the request property.
   *
   * @param  {String} key Request property key
   */
  clearProperty(key) {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.clearProperty(key);
  }

  /**
   * Returns the shared instance of request properties.
   *
   * @return {RequestProperties} Request properties shared instance.
   */
  static sharedInstance() {
    let requestProperties = RequestProperties[sharedInstanceSymbol];

    if (!requestProperties) {
      requestProperties = new RequestProperties();
      RequestProperties[sharedInstanceSymbol] = requestProperties;
    }

    return requestProperties;
  }
}

export default RequestProperties;
