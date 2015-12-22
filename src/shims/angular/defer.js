class AngularDefer {
  constructor($q) {
    this.$q = $q;
  }

  all(promises = []) {
    return this.$q.all(promises);
  }

  resolve(value) {
    return this.$q.resolve(value);
  }

  reject(reason) {
    return this.$q.reject(reason);
  }

  deferred() {
    return this.$q.defer();
  }
}

module.exports = AngularDefer;
