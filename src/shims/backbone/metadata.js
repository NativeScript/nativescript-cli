/**
 * Copyright 2014 Kinvey, Inc.
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

// Metadata.
// ---------

// The `Kinvey.Metadata` methods are mixed into Backbone models. To maintain
// the correct context, keep a `_metadata` property. Internally, the metadata
// (and ACL) operate on the models `attributes` property.
// NOTE Modifying the metadata (including the ACL) won’t emit `change` events.

// Helper function to lazy-initialize the metadata instance.
var backboneWrapMetadata = function(fn) {
  return function() {
    if(null === this._metadata) {
      this._metadata = new Kinvey.Metadata(this.attributes);
    }
    return fn.apply(this._metadata, arguments);
  };
};

// Extend the mixin with the metadata functionality.
_.extend(Kinvey.Backbone.ModelMixin, /** @lends Kinvey.Backbone.ModelMixin */{
  // The email verification metadata method is added in
  // `Kinvey.Backbone.UserMixin`.

  /**
   * The models’ metadata.
   *
   * @private
   * @type {Kinvey.Metadata}
   */
  _metadata: null,

  /**
   * Returns the models’ ACL.
   *
   * @method
   * @returns {Kinvey.Acl}
   */
  getAcl: backboneWrapMetadata(Kinvey.Metadata.prototype.getAcl),

  /**
   * Returns the date when the entity was created.
   *
   * @method
   * @returns {?Date} Created at date, or `null` if not set.
   */
  getCreatedAt: backboneWrapMetadata(Kinvey.Metadata.prototype.getCreatedAt),

  /**
   * Returns the date when the entity was last modified.
   *
   * @method
   * @returns {?Date} Last modified date, or `null` if not set.
   */
  getLastModified: backboneWrapMetadata(Kinvey.Metadata.prototype.getLastModified),

  /**
   * Sets the models’ ACL.
   *
   * @param {Kinvey.Acl} acl The acl.
   * @returns {Backbone.Model} The model.
   */
  setAcl: function() {
    backboneWrapMetadata(Kinvey.Metadata.prototype.setAcl).apply(this, arguments);
    return this;
  }
});