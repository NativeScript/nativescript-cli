import Datastore from './datastore';
import isArray from 'lodash/lang/isArray';
import Query from './query';
import defaultsDeep from 'lodash/object/defaults';
import Metadata from './metadata';
import Acl from './acl';
const dataSymbol = Symbol();

class Entity extends Datastore {
  constructor(data = {}) {
    super();
    this[dataSymbol] = data;
  }

  get data() {
    return this[dataSymbol];
  }

  get _id() {
    return this.data._id;
  }

  get metadata() {
    return new Metadata(this.data._kmd);
  }

  get acl() {
    return new Acl(this.data._acl);
  }

  toJSON() {
    return this.data;
  }

  static get(collection, id, options = {}) {
    const query = new Query();
    query.equalTo('_id', id);
    return this.find(query, options);
  }

  static find(collection, query, options = {}) {
    const promise = super.find(collection, query, options).then((array) => {
      const entities = [];

      if (!isArray(array)) {
        array = [].push(array);
      }

      for (let i = 0, len = array.length; i < len; i++) {
        const data = array[i];
        entities.push(new this(data));
      }

      if (entities.length === 0) {
        return null;
      } else if (entities.length === 1) {
        return entities[0];
      }

      return entities;
    });

    // Return the promise
    return promise;
  }

  static create(collection, data, options = {}) {
    const promise = super.create(collection, data, options).then((data) => {
      const entity = new this(data);
      return entity;
    });

    // Return the promise
    return promise;
  }

  update(collection, data, options = {}) {
    data = defaultsDeep(this.toJSON(), data);
    const promise = super.update(collection, data, options).then((data) => {
      this[dataSymbol] = data;
    });

    // Return the promise
    return promise;
  }

  destroy(collection, options = {}) {
    const promise = super.destroy(collection, this._id, options);

    // Return the promise
    return promise;
  }
}

export default Entity;
