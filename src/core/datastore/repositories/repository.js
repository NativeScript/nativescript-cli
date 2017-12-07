// TODO: name DataRepository?
export class Repository {
  _throwNotImplementedError() {
    throw new Error('Repository class abstract method not implemented');
  }

  create(collection, entities) {
    this._throwNotImplementedError(entities);
  }

  read(collection, query) {
    this._throwNotImplementedError(query);
  }

  readById(collection, id) {
    this._throwNotImplementedError(id);
  }

  count(collection, query) {
    this._throwNotImplementedError(query);
  }

  update(collection, entities) {
    this._throwNotImplementedError(entities);
  }

  delete(collection, query) {
    this._throwNotImplementedError(query);
  }

  deleteById(collection, id) {
    this._throwNotImplementedError(id);
  }
}
