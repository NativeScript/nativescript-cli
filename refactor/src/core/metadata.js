// Metadata.
// ---------

// Wrapper for accessing the `_acl` and `_kmd` properties of a document
// (i.e. entity and users).

/**
 * The Kinvey.Metadata class.
 *
 * @memberof! <global>
 * @class Kinvey.Metadata
 * @param {Object} document The document.
 * @throws {Kinvey.Error} `document` must be of type: `Object`.
 */
Kinvey.Metadata = function(document) {
  // Validate arguments.
  if(!isObject(document)) {
    throw new Kinvey.Error('document argument must be of type: Object.');
  }

  /**
   * The ACL.
   *
   * @private
   * @type {Kinvey.Acl}
   */
  this._acl = null;

  /**
   * The document.
   *
   * @private
   * @type {Object}
   */
  this._document = document;
};

// Define the Metadata methods.
Kinvey.Metadata.prototype = /** @lends Kinvey.Metadata# */{
  /**
   * Returns the document ACL.
   *
   * @returns {Kinvey.Acl} The ACL.
   */
  getAcl: function() {
    if(null === this._acl) {
      this._acl = new Kinvey.Acl(this._document);
    }
    return this._acl;
  },

  /**
   * Returns the date when the entity was created.
   *
   * @returns {?Date} Created at date, or `null` if not set.
   */
  getCreatedAt: function() {
    if(null != this._document._kmd && null != this._document._kmd.ect) {
      return new Date(this._document._kmd.ect);
    }
    return null;
  },

  /**
   * Returns the email verification status.
   *
   * @returns {?Object} The email verification status, or `null` if not set.
   */
  getEmailVerification: function() {
    if(null != this._document._kmd && null != this._document._kmd.emailVerification) {
      return this._document._kmd.emailVerification.status;
    }
    return null;
  },

  /**
   * Returns the date when the entity was last modified.
   *
   * @returns {?Date} Last modified date, or `null` if not set.
   */
  getLastModified: function() {
    if(null != this._document._kmd && null != this._document._kmd.lmt) {
      return new Date(this._document._kmd.lmt);
    }
    return null;
  },

  /**
   * Sets the document ACL.
   *
   * @param {Kinvey.Acl} acl The ACL.
   * @throws {Kinvey.Error} `acl` must be of type: `Kinvey.Acl`.
   * @returns {Kinvey.Metadata} The metadata.
   */
  setAcl: function(acl) {
    // Validate arguments.
    if(!(acl instanceof Kinvey.Acl)) {
      throw new Kinvey.Error('acl argument must be of type: Kinvey.Acl.');
    }

    this._acl = null;// Reset.
    this._document._acl = acl.toJSON();
    return this;
  },

  /**
   * Returns JSON representation of the document.
   *
   * @returns {Object} The document.
   */
  toJSON: function() {
    return this._document;
  }
};