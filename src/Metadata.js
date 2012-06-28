(function() {

  // Define the Kinvey Metadata class.
  Kinvey.Metadata = Base.extend({
    /**
     * Creates a new metadata instance.
     * 
     * @name Kinvey.Metadata
     * @constructor
     * @param {Object} [attr] Attributes containing metadata.
     */
    constructor: function(attr) {
      attr || (attr = {});
      this.acl = attr._acl || {};
      this.kmd = attr._kmd || {};
    },

    /** @lends Kinvey.Metadata# */

    /**
     * Adds item read permissions for user.
     * 
     * @param {string} user User id.
     */
    addReader: function(user) {
      this.acl.readers || (this.acl.readers = []);
      if(-1 === this.acl.readers.indexOf(user)) {
        this.acl.readers.push(user);
      }
    },

    /**
     * Adds item write permissions for user.
     * 
     * @param {string} user User id.
     */
    addWriter: function(user) {
      this.acl.writers || (this.acl.writers = []);
      if(-1 === this.acl.writers.indexOf(user)) {
        this.acl.writers.push(user);
      }
    },

    /**
     * Returns all readers.
     * 
     * @return {Array} List of readers.
     */
    getReaders: function() {
      return this.acl.readers || [];
    },

    /**
     * Returns all writers.
     * 
     * @return {Array} List of writers.
     */
    getWriters: function() {
      return this.acl.writers || [];
    },

    /**
     * Returns whether the current user owns the item. This method
     * is only useful when the class is created with a predefined
     * ACL.
     * 
     * @returns {Boolean}
     */
    isOwner: function() {
      var owner = this.acl.creator;
      var currentUser = Kinvey.getCurrentUser();

      if(owner && currentUser) {
        return owner === currentUser.getId();
      }
      return false;
    },

    /**
     * Returns last modified date, or null if not set.
     * 
     * @return {string} ISO-8601 formatted date.
     */
    lastModified: function() {
      return (this.kmd && this.kmd.lmt) || null;
    },

    /**
     * Returns whether the current user has write permissions.
     * 
     * @returns {Boolean}
     */
    hasWritePermissions: function() {
      if(this.isOwner() || this.isGloballyWritable()) {
        return true;
      }

      var currentUser = Kinvey.getCurrentUser();
      if(currentUser && this.acl.writers) {
        return -1 !== this.acl.writers.indexOf(currentUser.getId());
      }
      return false;
    },

    /**
     * Returns whether the item is globally readable.
     * 
     * @returns {Boolean}
     */
    isGloballyReadable: function() {
      return !!this.acl.globalRead;
    },

    /**
     * Returns whether the item is globally writable.
     * 
     * @returns {Boolean}
     */
    isGloballyWritable: function() {
      return !!this.acl.globalWrite;
    },

    /**
     * Removes item read permissions for user.
     * 
     * @param {string} user User id.
     */
    removeReader: function(user) {
      if(this.acl.readers) {
        var index = this.acl.readers.indexOf(user);
        if(-1 !== index) {
          this.acl.readers.splice(index, 1);
        }
      }
    },

    /**
     * Removes item write permissions for user.
     * 
     * @param {string} user User id.
     */
    removeWriter: function(user) {
      if(this.acl.writers) {
        var index = this.acl.writers.indexOf(user);
        if(-1 !== index) {
          this.acl.writers.splice(index, 1);
        }
      }
    },

    /**
     * Sets whether the item is globally readable.
     * 
     * @param {Boolean} flag
     */
    setGloballyReadable: function(flag) {
      this.acl.globalRead = !!flag;
    },

    /**
     * Sets whether the item is globally writable.
     * 
     * @param {Boolean} flag
     */
    setGloballyWritable: function(flag) {
      this.acl.globalWrite = !!flag;
    },

    /**
     * Returns JSON representation. Used by JSON#stringify.
     * 
     * @returns {object} JSON representation.
     */
    toJSON: function() {
      return {
        _acl: this.acl,
        _kmd: this.kmd
      };
    }
  });

}());