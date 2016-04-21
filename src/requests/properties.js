import { KinveyError } from '../errors';
import isPlainObject from 'lodash/isPlainObject';
const appVersionKey = 'appVersion';

/**
 * Request Properties class
 */
export class RequestProperties {
  constructor(properties = {}) {
    this.properties = properties;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties) {
    this._properties = properties;
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
   * @param  {Any} version App version.
   * @return {RequestProperties} The request properties instance.
   */
  set appVersion(args) {
    const version = Array.prototype.slice.call(args, 1);
    const major = args[0];
    const minor = version[1];
    const patch = version[2];
    let appVersion = '';

    if (major) {
      appVersion = `${major}`.trim();
    }

    if (minor) {
      appVersion = `.${minor}`.trim();
    }

    if (patch) {
      appVersion = `.${patch}`.trim();
    }

    this.setProperty(appVersionKey, appVersion);
    return this;
  }

  /**
   * Returns the request property for the key or `undefined` if
   * it has not been set.
   *
   * @param  {String} key Request property key
   * @return {*} Request property value
   */
  getProperty(key) {
    const properties = this.toJSON();

    if (key && properties.hasOwnProperty(key)) {
      return properties[key];
    }

    return undefined;
  }

  /**
   * Sets the request property key to the value.
   *
   * @param {String} key Request property key
   * @param {*} value Request property value
   * @return {RequestProperties} The request properties instance.
   */
  setProperty(key, value) {
    const properties = {};
    properties[key] = value;
    this.addProperties(properties);
    return this;
  }

  addProperties(properties) {
    if (!isPlainObject(properties)) {
      throw new KinveyError('properties argument must be an object');
    }

    Object.keys(properties).forEach((key) => {
      const value = properties[key];

      if (value) {
        this.properties[key] = value;
      } else {
        delete this.properties[key];
      }
    });
  }

  clear() {
    this.properties = {};
  }

  clearProperty(key) {
    const properties = this.properties;

    if (key && properties.hasOwnProperty(key)) {
      delete properties[key];
    }
  }

  /**
   * Clears the app version property.
   *
   * @return {RequestProperties} The request properties instance.
   */
  clearAppVersion() {
    return this.clearProperty(appVersionKey);
  }

  toJSON() {
    return this.properties;
  }
}
