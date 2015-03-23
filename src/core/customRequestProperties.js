/**
 * Copyright 2015 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Custom Request Properties
// ----

// Set and get custom request properties for the application.

var customRequestProperties = {};

var clearCustomRequestProperty = function(name) {
  if (null != name && customRequestProperties.hasOwnProperty(name)) {
    delete customRequestProperties[name];
  }
};

var clearCustomRequestProperties = function() {
  customRequestProperties = {};
};

/**
 * The `Kinvey.CustomRequestProperties` class.
 *
 * @memberof! <global>
 * @class Kinvey.CustomRequestProperties
 */
Kinvey.CustomRequestProperties = /** @lends Kinvey.CustomRequestProperties */ {

  /**
   * Returns the custom request properties that have been set.
   * @return {Object} Custom request properties
   */
  properties: function() {
    return customRequestProperties;
  },

  /**
   * Returns the custom request property for the name or `undefined` if
   * it has not been set.
   *
   * @param  {string} name Custom request property name
   * @return {any}         Custom request property value
   */
  property: function(name) {
    if (null != name && customRequestProperties.hasOwnProperty(name)) {
      return customRequestProperties[name];
    }

    return undefined;
  },

  /**
   * Replaces all custom request properties with the properties
   * provided.
   *
   * @param {Object} properties Custom request properties
   */
  setProperties: function(properties) {
    Kinvey.CustomRequestProperties.clear();
    Kinvey.CustomRequestProperties.addProperties(properties);
  },

  /**
   * Sets the custom request property for the name and value.
   *
   * @param {string} name  Custom request property name
   * @param {string} value Custom request property value
   */
  setProperty: function(name, value) {
    var properties = {};
    properties[name] = value;
    Kinvey.CustomRequestProperties.addProperties(properties);
  },

  /**
   * Adds to the properties to the exisiting custom request properties
   * replacing any that already existed.
   *
   * @param {Object} properties Custom request properties
   */
  addProperties: function(properties) {
    if (properties != null) {
      Object.keys(properties).forEach(function(name) {
        var value = properties[name];

        // Debug
        if (KINVEY_DEBUG) {
          log('Adding custom request property ' + name + ' as ' + value + '.');
        }

        customRequestProperties[name] = value;
      });
    }
  },

  /**
   * Clears all the custom request properties.
   */
  clear: function() {
    // Debug
    if (KINVEY_DEBUG) {
      log('Clearing the custom request properties.');
    }

    clearCustomRequestProperties();
  },

  /**
   * Clears one custom request property.
   *
   * @param  {string} name Custom request property name
   */
  clearProperty: function(name) {
    // Debug
    if (KINVEY_DEBUG) {
      log('Clearing the custom request property ' + name + '.');
    }

    clearCustomRequestProperty(name);
  }
};
