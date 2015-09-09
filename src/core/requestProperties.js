import Cache from './cache';
import clone from 'lodash/lang/clone';
import merge from 'lodash/object/merge';
const privateRequestPropertiesSymbol = Symbol();
const requestPropertiesKey = 'requestProperties';

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

    // Save
    this.save();
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

    // Save
    this.save();
  }

  clear() {
    // Set properties to an empty object
    this.properties = {};

    // Save
    this.save();
  }

  clearProperty(key) {
    const properties = this.properties;

    // Delete the value if the properties contains the key
    if (name && properties.hasOwnProperty(key)) {
      delete properties[key];
    }

    // Save
    this.save();
  }

  save() {
    // Save the properties to the cache
    const cache = Cache.sharedInstance();
    return cache.set(requestPropertiesKey, this.properties);
  }
}

class RequestProperties {
  /**
   * Returns the request properties that have been set for the application.
   *
   * @return {Object} Request properties
   */
  get properties() {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    return clone(privateRequestProperties.properties);
  }

  /**
   * Replaces all request properties with the provided properties.
   *
   * @param {Object} properties Request properties
   */
  set properties(properties) {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.properties = properties;
  }

  constructor(properties = {}) {
    this[privateRequestPropertiesSymbol] = new PrivateRequestProperties(properties);
  }

  /**
   * Returns the request property for the name or `undefined` if
   * it has not been set.
   *
   * @param  {String} name Request property name
   * @return {*}           Request property value
   */
  property(name) {
    const properties = this.properties;

    if (name && properties.hasOwnProperty(name)) {
      return properties[name];
    }

    return undefined;
  }

  /**
   * Sets the request property for the name and value.
   *
   * @param {String} name  Request property name
   * @param {*}      value Request property value
   */
  setProperty(name, value) {
    const properties = {};
    properties[name] = value;
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
   * @param  {String} name Request property name
   */
  clearProperty(name) {
    const privateRequestProperties = this[PrivateRequestPropertiesSymbol];
    privateRequestProperties.clearProperty(name);
  }
}

export default RequestProperties;
