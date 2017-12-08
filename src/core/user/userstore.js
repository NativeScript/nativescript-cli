import Promise from 'es6-promise';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import url from 'url';
import { Client } from '../client';
import { AuthType, RequestMethod, KinveyRequest } from '../request';
import { KinveyError } from '../errors';
import { KinveyObservable, wrapInObservable } from '../observable';
import { isDefined } from '../utils';
import { Query } from '../query';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */
export class UserStore {
  _client;

  constructor() {
    this._client = Client.sharedInstance();
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get pathname() {
    return `/user/${this._client.appKey}`;
  }

  /**
   * Lookup users.
   * [User Discovery](http://devcenter.kinvey.com/guides/users#lookup)
   *
   * @param {Query} [query] Query used to filter entities.
   * @param {Object} [options] Options
   * @return {Observable} Observable.
   */
  lookup(query, options = {}) {
    if (isDefined(query) && !(query instanceof Query)) {
      const msg = 'Invalid query. It must be an instance of the Query class.';
      return wrapInObservable(Promise.reject(new KinveyError(msg)));
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Default,
      url: url.format({
        protocol: this._client.apiProtocol,
        host: this._client.apiHost,
        pathname: `${this.pathname}/_lookup`
      }),
      properties: options.properties,
      body: isDefined(query) ? query.toPlainObject().filter : null,
      timeout: options.timeout,
      client: this._client
    });

    const promise = request.execute()
      .then(resp => resp.data);

    return wrapInObservable(promise);
  }

  /**
   * @private
   * @throws {KinveyError} Method is unsupported. Instead use User.signup() to create a user.
   */
  create() {
    return Promise.reject(new KinveyError('Please use `User.signup()` to create a user.'));
  }

  /**
   * Update a user.
   *
   * @param {Object} data Data for user to update.
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The updated user data.
   */
  update(data, options = {}) {
    if (!data) {
      return Promise.reject(new KinveyError('No user was provided to be updated.'));
    }

    if (isArray(data)) {
      return Promise.reject(new KinveyError('Only one user can be updated at one time.', data));
    }

    if (!data._id) {
      return Promise.reject(new KinveyError('User must have an _id.'));
    }

    if (isDefined(data) === false) {
      return Promise.resolve(null);
    }

    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      authType: AuthType.Default,
      url: url.format({
        protocol: this._client.apiProtocol,
        host: this._client.apiHost,
        pathname: `${this.pathname}/${data._id}`
      }),
      properties: options.properties,
      data: data,
      timeout: options.timeout,
      client: this._client
    });
    return request.execute()
      .then(response => response.data);
  }

  /**
   * Check if a username already exists.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {boolean} True if the username already exists otherwise false.
   */
  exists(username, options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this._client.apiProtocol,
        host: this._client.apiHost,
        pathname: `/rpc/${this._client.appKey}/check-username-exists`
      }),
      properties: options.properties,
      data: { username: username },
      timeout: options.timeout,
      client: this._client
    });
    return request.execute()
      .then(response => response.data)
      .then((data = {}) => data.usernameExists === true);
  }

  /**
   * Remove a user.
   *
   * @param   {string}  id               Id of the user to remove.
   * @param   {Object}  [options]        Options
   * @param   {boolean} [options.hard=false]   Boolean indicating whether user should be permanently removed from the backend (defaults to false).
   * @return  {Promise}
   */
  removeById(id, options = {}) {
    const stream = KinveyObservable.create((observer) => {
      if (isDefined(id) === false) {
        return observer.error(new KinveyError(
          'An id was not provided.',
          'Please provide a valid id for a user that you would like to remove.'
        ));
      }

      if (isString(id) === false) {
        return observer.error(new KinveyError(
          'The id provided is not a string.',
          'Please provide a valid id for a user that you would like to remove.'
        ));
      }

      const request = new KinveyRequest({
        method: RequestMethod.DELETE,
        authType: AuthType.Default,
        url: url.format({
          protocol: this._client.apiProtocol,
          host: this._client.apiHost,
          pathname: `${this.pathname}/${id}`,
          query: options.hard === true ? { hard: true } : undefined
        }),
        properties: options.properties,
        timeout: options.timeout
      });
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });

    return stream.toPromise();
  }
}
