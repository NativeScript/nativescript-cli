import Kinvey from '../kinvey';
import Model from './model';
import Request from './request';
import HttpMethod from './enums/httpMethod';
import DataPolicy from './enums/dataPolicy';
import AuthType from './enums/authType';
import Query from './query';
import Aggregation from './aggregation';
import KinveyError from './errors/error';
import when from 'when';
import map from 'lodash/collection/map';
import defaults from 'lodash/object/defaults';
import clone from 'lodash/lang/clone';
import assign from 'lodash/object/assign';
import bind from 'lodash/function/bind';
import isFunction from 'lodash/lang/isFunction';
import isDefined from '../utils/isDefined';
import isArray from 'lodash/lang/isArray';
import isString from 'lodash/lang/isString';
const setOptions = {add: true, remove: true, merge: true};
const addOptions = {add: true, remove: false};

class Collection {
  constructor(name, models = [], options = {}) {
    options = defaults({}, options, {
      client: Kinvey.sharedClientInstance(),
      model: Model
    });

    this.client = options.client;
    this.namespace = 'appdata';
    this.name = name;
    this.model = options.model;
    this.comparator = options.comparator;
    this._reset();

    if (models) {
      this.reset(models, assign({ silent: true }, options));
    }
  }

  get path() {
    let path = `/${this.namespace}/${this.client.appKey}`;

    if (isDefined(this.name)) {
      path = `${path.replace(/[^\/]$/, '$&/')}${encodeURIComponent(this.name)}`;
    }

    return path;
  }

  toJSON() {
    return map(this.models, (model) => {
      return isFunction(model.toJSON) ? model.toJSON() : model;
    });
  }

  add(models = [], options = {}) {
    return this.set(models, assign({ merge: false }, options, addOptions));
  }

  remove(models = [], options = {}) {
    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const removed = this._removeModels(models, options);
    return singular ? removed[0] : removed;
  }

  set(models = [], options = {}) {
    options = defaults({}, options, setOptions);

    if (options.parse && !this._isModel(models)) {
      models = this.parse(models, options);
    }

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();

    let id;
    let model;
    let attrs;
    let sort;
    let at = options.at;

    if (isDefined(at)) {
      at = +at;
    }

    if (at < 0) {
      at += this.length + 1;
    }

    const sortable = this.comparator && !isDefined(at) && options.sort !== false;
    const sortAttr = isString(this.comparator) ? this.comparator : null;
    const toAdd = [];
    const toRemove = [];
    const modelMap = {};
    const add = options.add;
    const merge = options.merge;
    const remove = options.remove;
    const order = !sortable && add && remove ? [] : false;
    let orderChanged = false;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    for (let i = 0, len = models.length; i < len; i++) {
      attrs = models[i];
      const existing = this.get(attrs);

      // If a duplicate is found, prevent it from being added and
      // optionally merge it into the existing model.
      if (existing) {
        if (remove) {
          modelMap[existing.cid] = true;
        }

        if (merge && attrs !== existing) {
          attrs = this._isModel(attrs) ? attrs.attributes : attrs;

          if (options.parse) {
            attrs = existing.parse(attrs, options);
          }

          existing.set(attrs, options);

          if (sortable && !sort && existing.hasChanged(sortAttr)) {
            sort = true;
          }
        }

        models[i] = existing;
      } else if (add) {
        model = models[i] = this._prepareModel(attrs, options);

        if (!model) {
          continue;
        }

        toAdd.push(model);
        this._addReference(model, options);
      }

      // Do not add mutiple models with the same `_id`.
      model = existing || model;

      if (!model) {
        continue;
      }

      id = this.modelId(model.attributes);
      if (order && (model.isNew() || !modelMap[id])) {
        order.push(model);

        // Check to see if this is actually a new model at this index.
        orderChanged = orderChanged || !this.models[i] || model.cid !== this.models[i].cid;
      }

      modelMap[id] = true;
    }

    // Remove nonexistent models if appropriate.
    if (remove) {
      for (let i = 0, len = this.length; i < len; i++) {
        const model = this.models[i];

        if (!modelMap[model.cid]) {
          toRemove.push(model);
        }
      }

      if (toRemove.length) {
        this._removeModels(toRemove, options);
      }
    }

    // See if sorting is needed, update `length` and splice in new models.
    if (toAdd.length || orderChanged) {
      if (sortable) {
        sort = true;
      }

      this.length += toAdd.length;

      if (isDefined(at)) {
        for (let i = 0, len = toAdd.length; i < len; i++) {
          this.models.splice(at + i, 0, toAdd[i]);
        }
      } else {
        if (order) {
          this.models.length = 0;
        }

        const orderedModels = order || toAdd;

        for (let i = 0, len = orderedModels.length; i < len; i++) {
          this.models.push(orderedModels[i]);
        }
      }
    }

    // Silently sort the collection if appropriate
    if (sort) {
      this.sort({ silent: true });
    }

    // Return the added (or merged) model (or models).
    return singular ? models[0] : models;
  }

  reset(models = [], options = {}) {
    options = clone(options);

    for (let i = 0, len = this.models.length; i < len; i++) {
      this._removeReference(this.models[i], options);
    }

    this._reset();
    models = this.add(models, assign({ silent: true }, options));
    return models;
  }

  get(obj) {
    if (!isDefined(obj)) {
      return undefined;
    }

    const id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
    return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
  }

  sort() {
    if (!this.comparator) {
      throw new Error('Cannot sort a set without a comparator.');
    }

    // Run sort based on type of `comparator`.
    if (isString(this.comparator) || this.comparator.length === 1) {
      this.models = this.sortBy(this.comparator, this);
    } else {
      this.models.sort(bind(this.comparator, this));
    }

    return this;
  }

  find(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return when.reject(new KinveyError('query argument must be of type Kinvey.Query'));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default,
      parse: true
    }, options);

    const request = new Request(HttpMethod.GET, this.path, query, null, options);
    const promise = request.execute().then((response) => {
      let data = response.data;

      if (options.parse) {
        data = this.parse(data);
      }

      const fn = options.reset ? 'reset' : 'set';
      return this[fn](data, options);
    });

    return promise;
  }

  get(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default,
      parse: true
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      const request = new Request(HttpMethod.GET, `${this.path}/${model.id}`, null, null, opts);
      const promise = request.execute().then((response) => {
        let data = response.data;

        if (opts.parse) {
          data = this.parse(data);
        }

        const fn = options.reset ? 'reset' : 'set';
        return this[fn](data, options);
      });

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  count(query, options = {}) {
    if (query && !(query instanceof Query)) {
      return when.reject(new KinveyError('query argument must be of type Kinvey.Query'));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const request = new Request(HttpMethod.GET, `${this.path}/_count`, query, null, options);
    const promise = request.execute().then((response) => {
      const data = response.data;

      if (data) {
        return data.count;
      }

      return {count: 0};
    });

    return promise;
  }

  group(aggregation, options = {}) {
    if (!(aggregation instanceof Aggregation)) {
      return when.reject(new KinveyError('aggregation argument must be of type Kinvey.Group'));
    }

    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const request = new Request(HttpMethod.GET, `${this.path}/_group`, null, aggregation.toJSON(), options);
    const promise = request.execute().then((response) => {
      const data = response.data;
      return aggregation.process(data);
    });

    return promise;
  }

  save(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const wait = options.wait;
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let path = this.path;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (!wait) {
        this.add(model, options);
      }

      let method = HttpMethod.POST;
      if (!model.isNew()) {
        path = `${path}/${model.id}`;

        if (opts.patch) {
          method = HttpMethod.PATCH;
        } else {
          method = HttpMethod.PUT;
        }
      }

      const request = new Request(method, path, null, model.toJSON(), opts);
      const promise = request.execute().then((response) => {
        const data = response.data;
        model.set(data, opts);

        if (wait) {
          this.add(model, opts);
        }

        return model;
      });

      promises.push(promise);
    }

    return Promise.all(promises).then((models) => {
      return singular ? models[0] : models;
    });
  }

  destroy(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const wait = options.wait;
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (!wait) {
        this.remove(model, options);
      }

      const request = new Request(HttpMethod.DELETE, `${this.path}/${model.id}`, null, null, opts);
      const promise = request.execute().then((response) => {
        if (wait) {
          this.remove(model, opts);
        }

        return response.data;
      });

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  parse(data) {
    return data;
  }

  modelId(attrs) {
    return attrs[this.model.prototype.idAttribute || '_id'];
  }

  _reset() {
    this.length = 0;
    this.models = [];
    this._byId = {};
  }

  _prepareModel(attrs, options = {}) {
    if (this._isModel(attrs)) {
      if (!attrs.collection) {
        attrs.collection = this;
      }

      return attrs;
    }

    options = clone(options, true);
    options.collection = this;
    const model = new this.model(attrs, options);

    if (!model.validationError) {
      return model;
    }

    return false;
  }

  _removeModels(models = [], options = {}) {
    const removed = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this.get(models[i]);

      if (!model) {
        continue;
      }

      const index = this.models.indexOf(model);
      this.models.splice(index, 1);
      this.length--;

      removed.push(model);
      this._removeReference(model, options);
    }

    return removed.length ? removed : false;
  }

  _isModel(model) {
    return model instanceof Model;
  }

  _addReference(model) {
    this._byId[model.cid] = model;
    const id = this.modelId(model.attributes);

    if (isDefined(id)) {
      this._byId[id] = model;
    }
  }

  _removeReference(model) {
    delete this._byId[model.cid];
    const id = this.modelId(model.attributes);

    if (isDefined(id)) {
      delete this._byId[id];
    }

    if (this === model.collection) {
      delete model.collection;
    }
  }
}

export default Collection;
