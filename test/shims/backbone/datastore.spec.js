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

// Obtain a reference to the top-level describe method.
var globalDescribe = describe;

/**
 * The Kinvey.Backbone.Model test suite.
 */
describe('Kinvey.Backbone.Model', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: create a model.
  beforeEach(function() {
    this.model     = new Kinvey.Backbone.Model();
    this.model.url = this.collection;
  });
  afterEach(function() {// Cleanup.
    delete this.model;
  });

  // Kinvey.Backbone.Model.
  describe('the constructor', function() {
    // Test suite.
    it('should create a new model.', function() {
      var model = new Kinvey.Backbone.Model();
      expect(model).to.be.an.instanceOf(Kinvey.Backbone.Model);
      expect(model).to.be.an.instanceOf(Backbone.Model);
    });
  });

  // Kinvey.Backbone.Model.idAttribute.
  describe('the idAttribute property', function() {
    // Test suite.
    it('should equal `_id`.', function() {
      expect(this.model.idAttribute).to.equal('_id');
    });
  });

  // Kinvey.Backbone.Model.sync.
  describe('the sync property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.Sync.', function() {
      expect(this.model.sync.toString()).to.contain('Kinvey.Backbone.Sync');
    });
  });

  // Kinvey.Backbone.Model.fetch.
  describe('the fetch method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, {}).then(function(doc) {
        _this.doc = doc;
      });
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Housekeeping: preseed the model.
    beforeEach(function() {
      this.model.set(this.model.idAttribute, this.doc._id);
    });

    // Test suite.
    it('should throw on invalid arguments: missing collection.', function() {
      delete this.model.url;
      var _this = this;
      expect(function() {
        _this.model.fetch();
      }).to.Throw('url');
    });

    it('should retrieve the document.', function() {
      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function(response) {
        expect(response).to.have.length(3);// data, textStatus, xhr.

        expect(response[0]).to.contain.keys(['_acl', '_id', '_kmd']);
        expect(response[0]).to.deep.equal(_this.doc);
        expect(response[1]).to.exist;
        expect(response[2]).to.exist;
        expect(response[2]).to.have.property('responseText');// xhr.

        // Inspect the model.
        expect(_this.model.attributes).to.deep.equal(response[0]);
      });
    });
    it('should fail if the document does not exist.', function() {
      this.model.set(this.model.idAttribute, this.randomID());

      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(args).to.have.length(3);// status, xhr, response.
        expect(args[0]).to.exist;// statusText.
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });

    ('undefined' === typeof Titanium) && it('should support `ajax` options.', function() {
      // Test the `beforeSend` and `timeout` options.
      var options = {
        beforeSend : sinon.spy(),
        timeout    : 1
      };
      var promise = this.jQueryToKinveyPromise(this.model.fetch(options));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(options.beforeSend).to.be.calledOnce;

        // Inspect arguments.
        expect(args).to.have.length(3);// statusText, xhr, error.
        expect(args[0]).to.exist;
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.REQUEST_TIMEOUT_ERROR);
      });
    });
    it('should support the `url` option.', function() {
      var id      = this.randomID();
      var url     = this.collection + '/' + id;
      var promise = this.jQueryToKinveyPromise(this.model.fetch({ url: url }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error[2]).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });

    it('should trigger a change event.', function() {
      var spy = sinon.spy();
      this.model.on('change', spy);

      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a change:attribute event.', function() {
      var spy = sinon.spy();
      this.model.on('change:_kmd', spy);

      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger an error event on failure.', function() {
      var spy = sinon.spy();
      this.model.on('error', spy);

      this.model.set(this.model.idAttribute, this.randomID());

      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[2]);// xhr.
      });
    });
    ('undefined' !== typeof Backbone && '0.9.9' <= Backbone.VERSION) &&
     it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this = this;
      var promise = this.jQueryToKinveyPromise(this.model.fetch());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[0]);// response.
      });
    });
    it('should return a Backbone promise.', function() {
      var _this   = this;
      var promise = this.model.fetch();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.deep.equal(_this.doc);// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.fetch({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        if('0.9.9' <= Backbone.VERSION) {// Version-dependent.
          expect(args[2]).to.be.an('object');// Options.
        }
      });
    });
    it('should support callbacks on failure.', function() {
      this.model.set(this.model.idAttribute, this.randomID());// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.fetch({ error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.Model.save.
  describe('the save method', function() {
    // Housekeeping: reset app.
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;
    });

    // Housekeeping: delete the created documents (if any).
    afterEach(function() {
      return Kinvey.DataStore.clean(this.collection);
    });

    // Test suite.
    it('should throw on invalid arguments: missing collection.', function() {
      delete this.model.url;
      var _this = this;
      expect(function() {
        _this.model.save();
      }).to.Throw('url');
    });

    it('should create a new document.', function() {
      var value = this.randomID();
      this.model.set({ field: value });

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(response).to.have.length(3);// data, textStatus, xhr.

        expect(response[0]).to.contain.keys(['_acl', '_id', '_kmd', 'field']);
        expect(response[0].field).to.equal(value);
        expect(response[1]).to.exist;
        expect(response[2]).to.exist;
        expect(response[2]).to.have.property('responseText');// xhr.

        // Inspect the model.
        expect(_this.model.attributes).to.deep.equal(response[0]);
      });
    });
    it('should update an existing document.', function() {
      var value = this.randomID();
      this.model.set(this.model.idAttribute, value);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(response).to.have.length(3);// data, statusText, xhr.

        expect(response[0]).to.contain.keys(['_acl', '_id', '_kmd']);
        expect(response[0]._id).to.equal(value);
        expect(response[1]).to.exist;
        expect(response[2]).to.exist;
        expect(response[2]).to.have.property('responseText');// xhr.

        // Inspect the model.
        expect(_this.model.attributes).to.deep.equal(response[0]);
      });
    });

    it('should support the `attrs` option.', function() {
      var value = this.randomID();
      this.model.set('field', this.randomID());

      var savePromise = this.model.save({}, { attrs: { anotherField: value } });
      var promise     = this.jQueryToKinveyPromise(savePromise);
      return promise.then(function(response) {
        expect(response[0]).to.have.property('anotherField', value);
        expect(response[0]).not.to.have.property('field');
      });
    });
    ('undefined' === typeof Titanium) && it('should support `ajax` options.', function() {
      // Test the `beforeSend` and `timeout` options.
      var options = {
        beforeSend : sinon.spy(),
        timeout    : 1
      };
      var promise = this.jQueryToKinveyPromise(this.model.save({}, options));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(options.beforeSend).to.be.calledOnce;

        // Inspect arguments.
        expect(args).to.have.length(3);// statusText, xhr, error.
        expect(args[0]).to.exist;
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.REQUEST_TIMEOUT_ERROR);
      });
    });
    it('should support the `url` option.', function() {
      var id      = this.randomID();
      var url     = this.collection + '/' + id;
      var promise = this.jQueryToKinveyPromise(this.model.save({}, { url: url }));
      return promise.then(function(response) {
        expect(response[0]).to.have.property('_id', id);
      });
    });

    it('should trigger a change event.', function() {
      var spy = sinon.spy();
      this.model.on('change', spy);

      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a change:attribute event.', function() {
      var spy = sinon.spy();
      this.model.on('change:_id', spy);

      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger an error event on failure.', function() {
      var spy = sinon.spy();
      this.model.on('error', spy);

      Kinvey.appKey = this.randomID();
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[2]);// xhr.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[0]);// response.
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.model.save();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('_id');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.save({}, { success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        if('0.9.9' <= Backbone.VERSION) {// Version-dependent.
          expect(args[2]).to.be.an('object');// Options.
        }
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save({}, { error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.Model.destroy.
  describe('the destroy method', function() {
    // Housekeeping: create a document.
    beforeEach(function() {
      return this.jQueryToKinveyPromise(this.model.save());
    });

    // Housekeeping: delete the created documents (if any).
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;// Restore.
      return Kinvey.DataStore.clean(this.collection);
    });

    // Test suite.
    it('should throw on invalid arguments: missing collection.', function() {
      delete this.model.url;
      var _this = this;
      expect(function() {
        _this.model.destroy();
      }).to.Throw('url');
    });
    it('should delete the document.', function() {
      var promise = this.jQueryToKinveyPromise(this.model.destroy());
      return promise.then(function(response) {
        expect(response).to.have.length(3);// data, textStatus, xhr.

        expect(response[1]).to.exist;// statusText.
        expect(response[2]).to.have.property('responseText');// xhr.
      });
    });
    it('should fail if the document does not exist.', function() {
      this.model.set(this.model.idAttribute, this.randomID());

      var promise = this.jQueryToKinveyPromise(this.model.destroy());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(args).to.have.length(3);// statusText, xhr, response.
        expect(args[0]).to.exist;// statusText.
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });
    it('should fail when the document does not exist, and the `silent` flag was set.', function() {
      this.model.set(this.model.idAttribute, this.randomID());

      var promise = this.jQueryToKinveyPromise(this.model.destroy({ silent: true }));
      return expect(promise).to.be.rejected;
    });
    it(
      'should succeed when the document does not exist, and the `silentFail` flag was set.',
      function() {
        this.model.set(this.model.idAttribute, this.randomID());

        var promise = this.jQueryToKinveyPromise(this.model.destroy({ silentFail: true }));
        return expect(promise).to.be.fulfilled;
      }
    );

    ('undefined' === typeof Titanium) && it('should support `ajax` options.', function() {
      // Test the `beforeSend` and `timeout` options.
      var options = {
        beforeSend : sinon.spy(),
        timeout    : 1
      };
      var promise = this.jQueryToKinveyPromise(this.model.destroy(options));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(options.beforeSend).to.be.calledOnce;

        // Inspect arguments.
        expect(args).to.have.length(3);// statusText, xhr, error.
        expect(args[0]).to.exist;
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.REQUEST_TIMEOUT_ERROR);
      });
    });
    it('should support the `url` option.', function() {
      var id      = this.randomID();
      var url     = this.collection + '/' + id;
      var promise = this.jQueryToKinveyPromise(this.model.destroy({ url: url }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.deep.property('[2].name', Kinvey.Error.ENTITY_NOT_FOUND);
      });
    });

    it('should trigger a destroy event.', function() {
      var spy = sinon.spy();
      this.model.on('destroy', spy);

      var promise = this.jQueryToKinveyPromise(this.model.destroy());
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[2]);// xhr.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        expect(spy.getCall(0).args).to.have.length.of.at.least(2);
        expect(spy.getCall(0).args[0]).to.deep.equal(_this.model);// Model.
        expect(spy.getCall(0).args[1]).to.deep.equal(response[0]);// response.
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.model.destroy();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('count', 1);// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.destroy({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        if('0.9.9' <= Backbone.VERSION) {// Version-dependent.
          expect(args[2]).to.be.an('object');// Options.
        }
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.destroy({ error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

});

/**
 * The Kinvey.Backbone.Collection test suite.
 */
describe('Kinvey.Backbone.Collection', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: create a collection.
  beforeEach(function() {
    this.col     = new Kinvey.Backbone.Collection();
    this.col.url = this.collection;
  });
  afterEach(function() {// Cleanup.
    delete this.col;
  });

  // Kinvey.Backbone.Collection.
  describe('the constructor', function() {
    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      var _this = this;
      expect(function() {
        _this.col = new Kinvey.Backbone.Collection([], { query: {} });
      }).to.Throw('Kinvey.Query');
    });
    it('should create a new collection.', function() {
      var collection = new Kinvey.Backbone.Collection();
      expect(collection).to.be.an.instanceOf(Kinvey.Backbone.Collection);
      expect(collection).to.be.an.instanceOf(Backbone.Collection);
    });
    it('should set the query if `options.query` was set.', function() {
      var query = new Kinvey.Query();
      var collection = new Kinvey.Backbone.Collection([], { query: query });
      expect(collection.query).to.equal(query);
    });
  });

  // Kinvey.Backbone.Collection.model.
  describe('the model property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.Model.', function() {
      expect(this.col.model).to.equal(Kinvey.Backbone.Model);
    });
  });

  // Kinvey.Backbone.Collection.sync.
  describe('the sync property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.Sync.', function() {
      expect(this.col.sync.toString()).to.contain('Kinvey.Backbone.Sync');
    });
  });

  // Kinvey.Backbone.Collection.clean.
  describe('the clean method', function() {
    // Housekeeping: create a document.
    beforeEach(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, { field: this.randomID() }).then(function(doc) {
        _this.doc = doc;
      });
    });
    afterEach(function() {// Delete the document (if not already done).
      Kinvey.appKey = config.test.appKey;// Restore.
      return Kinvey.DataStore.destroy(this.collection, this.doc._id, { silent: true });
    });
    afterEach(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should delete all documents.', function() {
      var promise = this.jQueryToKinveyPromise(this.col.clean());
      return promise.then(function(args) {
        expect(args).to.have.length(3);
        var response = args[0];
        var status   = args[1];
        var xhr      = args[2];

        // Inspect arguments.
        expect(response).to.have.property('count');
        expect(status).to.be.a('string');
        expect(xhr).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should delete all documents, with filter:attribute.', function() {
      var query   = new Kinvey.Query().equalTo('field', this.doc.field);
      var promise = this.jQueryToKinveyPromise(this.col.clean({ query: query }));
      return promise.then(function(args) {
        expect(args).to.have.deep.property('[0].count', 1);
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var _this = this;
      var promise = this.col.clean();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      // The `sync` event has the same arguments as the success handler.
      var args = null;
      var options = {
        success: function() { args = Array.prototype.slice.call(arguments);}
      };

      var promise = this.col.clean(options);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;
        expect(spy.lastCall.args).to.deep.equal(args);
      });
    });
    it('should trigger an error event.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      // The `sync` event has the same arguments as the error handler.
      var args = null;
      var options = {
        error: function() { args = Array.prototype.slice.call(arguments);}
      };

      var promise = this.col.clean(options);
      return this.jQueryToKinveyPromise(promise).then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).to.be.calledOnce;
        expect(spy.lastCall.args).to.deep.equal(args);
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.col.clean();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('count');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.col.clean({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.col.clean({ error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.Collection.count.
  describe('the count method', function() {
    // Housekeeping: create a document.
    before(function() {
      var _this = this;
      return Kinvey.DataStore.save(this.collection, { field: this.randomID() }).then(function(doc) {
        _this.doc = doc;
      });
    });
    after(function() {// Delete the document.
      return Kinvey.DataStore.destroy(this.collection, this.doc._id);
    });
    after(function() {// Cleanup.
      delete this.doc;
    });

    // Test suite.
    it('should count the number of documents.', function() {
      var promise = this.jQueryToKinveyPromise(this.col.count());
      return expect(promise).to.be.fulfilled;
    });
    it('should count the number of documents, with query.', function() {
      var query   = new Kinvey.Query().equalTo('field', this.doc.field);
      var promise = this.jQueryToKinveyPromise(this.col.count({ query: query }));
      return promise.then(function(response) {
        return expect(response[0]).to.equal(1);
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var _this   = this;
      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should not trigger an error event.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should not trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be.a('number');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.col.count({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.col.count({ error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Collection.create.
  describe('the create method', function() {
    // Housekeeping: delete the created document (if any).
    afterEach(function() {
      Kinvey.appKey = config.test.appKey;// Restore.
      return Kinvey.DataStore.clean(this.collection);
    });

    // Housekeeping: create a promise-able `Kinvey.Backbone.Collection.create`.
    before(function() {
      this.create = function(attrs, options) {
        // Prepare the response.
        var deferred = Kinvey.Defer.deferred();

        // Attach deferreds to callbacks.
        options = options || {};
        options.success = function() {
          deferred.resolve.call(this, arguments);
        };
        options.error = function() {
          deferred.reject.call(this, arguments);
        };

        // Call original and return the response.
        this.col.create(attrs, options);
        return deferred.promise;
      };
    });
    after(function() {// Cleanup.
      delete this.create;
    });

    // Test suite.
    it('should throw on invalid arguments: missing collection.', function() {
      delete this.col.url;
      var _this = this;
      expect(function() {
        _this.create({});
      }).to.Throw('url');
    });
    it('should save a new document.', function() {
      var _this   = this;
      var promise = this.create({});
      return promise.then(function(response) {
        expect(_this.col.models).to.have.length(1);
        expect(_this.col.models[0]).to.equal(response[0]);
      });
    });

    ('undefined' === typeof Titanium) && it('should support `ajax` options.', function() {
      // Test the `beforeSend` and `timeout` options.
      var options = {
        beforeSend : sinon.spy(),
        timeout    : 1
      };
      var promise = this.create({}, options);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(options.beforeSend).to.be.calledOnce;

        expect(error).to.have.length(3);// model, response, options.
        expect(error[1]).to.have.property('name', Kinvey.Error.REQUEST_TIMEOUT_ERROR);
      });
    });
    it('should support the `url` option.', function() {
      var id  = this.randomID();
      var url = this.collection + '/' + id;

      var _this   = this;
      var promise = this.create({}, { url: url });
      return promise.then(function() {
        expect(_this.col.models).to.have.length(1);
        expect(_this.col.models[0]).to.have.property('id', id);
      });
    });

    it('should trigger an add event.', function() {
      var spy = sinon.spy();
      this.col.on('add', spy);

      var promise = this.create({});
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    ('undefined' !== typeof Backbone && '0.9.9' <= Backbone.VERSION) &&
     it('should trigger an error event on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      var promise = this.create({});
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var promise = this.create({});
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    ('undefined' !== typeof Backbone && '0.9.9' <= Backbone.VERSION) &&
     it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      var promise = this.create({});
      return promise.then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
  });

  // Kinvey.Backbone.Collection.group.
  describe('the group method', function() {
    // Housekeeping: define an empty aggregation.
    beforeEach(function() {
      this.agg = new Kinvey.Group();
    });
    afterEach(function() {// Cleanup.
      delete this.agg;
    });

    // Test suite.
    it('should group by.', function() {
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg));
      return expect(promise).to.be.fulfilled;
    });
    it('should group with query.', function() {
      var query   = new Kinvey.Query().equalTo('field', this.randomID());
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg, { query: query }));
      return promise.then(function(response) {
        return expect(response[0]).to.deep.equal([]);
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var _this   = this;
      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should not trigger an error event.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should not trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be.an('array');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.col.group(this.agg, { success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg, { error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

});