import CoreObject from './object';
import Database from './database';
import Utils from './utils';
let kinvey = require('../kinvey').instance();
const database = Symbol();

class Local extends CoreObject {
  static get database() {
    if (!Utils.isDefined(this[database])) {
      this[database] = new Database(kinvey.appKey);
    }

    return this[database];
  }

  static create(request, options = {}) {
    return Local.save(request, options);
  }

  static read(request, options = {}) {
    options.foo = 'bar';
    return request;
  }

  static update(request, options = {}) {
    return Local.save(request, options);
  }

  static save(request, options = {}) {
    return Local.database().save(request.data, options);
  }

  static destroy(request, options = {}) {
    return Local.database().remove(request.data, options);
  }
}

export default Local;
