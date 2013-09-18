/**
 * Copyright 2013 Kinvey, Inc.
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

/* globals angular: true, Backbone: true, Ember: true, forge: true, jQuery: true */
/* globals ko: true, Titanium: true */

// Device information.
// -------------------

// Build the device information string sent along with every network request.
// <js-library>/<version> [(<library>/<version>,...)] <platform> <version> <manufacturer> <id>
var deviceInformation = function() {
  var browser, platform, version, manufacturer, id, libraries = [];

  // Helper function to detect the browser name and version.
  var browserDetect = function(ua) {
    // Cast arguments.
    ua = ua.toLowerCase();

    // User-Agent patterns.
    var rChrome  = /(chrome)\/([\w]+)/;
    var rFirefox = /(firefox)\/([\w.]+)/;
    var rIE      = /(msie) ([\w.]+)/i;
    var rOpera   = /(opera)(?:.*version)?[ \/]([\w.]+)/;
    var rSafari  = /(safari)\/([\w.]+)/;

    return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
     rOpera.exec(ua) || rSafari.exec(ua) || [];
  };

  // Platforms.
  if('undefined' !== typeof root.cordova &&
   'undefined' !== typeof root.device) {// PhoneGap
    var device = root.device;
    libraries.push('phonegap/' + device.cordova);
    platform     = device.platform;
    version      = device.version;
    manufacturer = device.model;
    id           = device.uuid;
  }
  else if('undefined' !== typeof Titanium) {// Titanium.
    libraries.push('titanium/' + Titanium.getVersion());

    // If mobileweb, extract browser information.
    if('mobileweb' === Titanium.Platform.getName()) {
      browser = browserDetect(Titanium.Platform.getModel());
      platform     = browser[1];
      version      = browser[2];
      manufacturer = Titanium.Platform.getOstype();
    }
    else {
      platform     = Titanium.Platform.getOsname();
      version      = Titanium.Platform.getVersion();
      manufacturer = Titanium.Platform.getManufacturer();
    }
    id = Titanium.Platform.getId();
  }
  else if('undefined' !== typeof forge) {// Trigger.io
    libraries.push('triggerio/' + (forge.config.platform_version || ''));
    id = forge.config.uuid;
  }
  else if('undefined' !== typeof process) {// Node.js
    platform     = process.title;
    version      = process.version;
    manufacturer = process.platform;
  }

  // Libraries.
  if('undefined' !== typeof angular) {// AngularJS.
    libraries.push('angularjs/' + angular.version.full);
  }
  if('undefined' !== typeof Backbone) {// Backbone.js.
    libraries.push('backbonejs/' + Backbone.VERSION);
  }
  if('undefined' !== typeof Ember) {// Ember.js.
    libraries.push('emberjs/' + Ember.VERSION);
  }
  if('undefined' !== typeof jQuery) {// jQuery.
    libraries.push('jquery/' + jQuery.fn.jquery);
  }
  if('undefined' !== typeof ko) {// Knockout.
    libraries.push('knockout/' + ko.version);
  }
  if('undefined' !== typeof Zepto) {// Zepto.js.
    libraries.push('zeptojs');
  }

  // Default platform, most likely this is just a plain web app.
  if(null == platform && root.navigator) {
    browser = browserDetect(root.navigator.userAgent);
    platform     = browser[1];
    version      = browser[2];
    manufacturer = root.navigator.platform;
  }

  // Return the device information string.
  var parts = [ 'js-<%= build %>/<%= pkg.version %>' ];
  if(0 !== libraries.length) {// Add external library information.
    parts.push('(' + libraries.sort().join(', ') + ')');
  }
  return parts.concat(
    [
      platform,
      version,
      manufacturer,
      id
    ].map(function(part) {
      return null != part ? part.toString().replace(/\s/g, '_').toLowerCase() : 'unknown';
    })
  ).join(' ');
};