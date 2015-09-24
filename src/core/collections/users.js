import AuthType from '../enums/authType';
import DataPolicy from '../enums/dataPolicy';
import Request from '../request';
import HttpMethod from '../enums/httpMethod';
import Kinvey from '../../kinvey';
import ActiveUserError from '../errors/activeUserError';
import Storage from '../storage';
import Model from '../models/model';
import Collection from '../collection';
import when from 'when';
import assign from 'lodash/object/assign';
import isObject from 'lodash/lang/isObject';
const activeUserSymbol = Symbol();
const activeUserKey = 'activeUser';
const userNamespace = 'user';
const rpcNamespace = 'rpc';

export default class Users extends Collection {
  constructor(name, models = [], options = {}) {
    super(name, models, options);
    this.namespace = userNamespace;
  }

 login(usernameOrData, password, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.App
    }, options);

    if (isObject(usernameOrData)) {
      options = options ? options : password;
    } else {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    if ((!usernameOrData.username || !usernameOrData.password) && !usernameOrData._socialIdentity) {
      return when.reject(new KinveyError('Username and/or password missing. Please provide both a username and password to login.'));
    }

    const prevName = this.name;
    this.name = 'login';
    const path = this.path;
    const request = new Request(HttpMethod.POST, path, null, usernameOrData, options);
    const promise = request.execute();

    promise = promise.then((response) => {
      return this.add(response.data, options);
    });

    return promise;
  }

  logout(options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.Session
    }, options);

    const prevName = this.name;
    this.name = '_logout';
    const path = this.path;
    const request = new Request(HttpMethod.POST, path, null, null, options);
    const promise = request.execute();
    return promise;
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

    let promise;

    if (options.discover) {
      const prevName = this.name;
      this.name = '_lookup';
      const path = this.path;
      const request = new Request(HttpMethod.POST, path, null, query.toJSON().filter, options);

      promise = request.execute().then((response) => {
        return response.data;
      }).finally(() => {
        this.name = prevName;
      });
    } else {
      promise = super.find(query, options);
    }

    return promise;
  }

  verifyEmail(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const prevName = this.name;
        this.name = model.get('username');
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-email-verification-initiate`, null, null, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
          this.name = prevName;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  forgotUsername(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('email')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-forgot-username`, null, {email: model.get('email'), opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  resetPassword(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const prevName = this.name;
        this.name = model.get('username');
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-password-reset-initiate`, null, null, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
          this.name = prevName;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  exists(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/check-username-exists`, null, {username: model.get('username')}, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
        });
      } else {
        promise = when.resolve({usernameExists: false});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  restore(models = [], options = {}) {
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
        promises.push(Promise.reject(new KinveyError('Model required')));
        continue;
      }

      const prevName = this.name;
      this.name = id;
      const path = this.path;
      const request = new Request(HttpMethod.POST, `${path}/_restore`, null, null, opts);
      const promise = request.execute().then((response) => {
        let data = response.data;

        if (opts.parse) {
          data = this.parse(data);
        }

        return data;
      }).finally(() => {
        this.name = prevName;
      });

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }
}
