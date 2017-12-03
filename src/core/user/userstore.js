import Promise from 'es6-promise';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import url from 'url';
import { AuthType, RequestMethod, KinveyRequest } from '../request';
import { KinveyError } from '../errors';
import { KinveyObservable } from '../observable';
import { isDefined } from '../utils';
import { Query } from '../query';
import { NetworkStore } from '../datastore';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */
export class UserStore extends NetworkStore {
  constructor(options) {
    super(null, options);
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get pathname() {
    return `/user/${this.client.appKey}`;
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
    const stream = KinveyObservable.create((observer) => {
      // Check that the query is valid
      if (isDefined(query) && !(query instanceof Query)) {
        return observer.error(new KinveyError('Invalid query. It must be an instance of the Query class.'));
      }

      const request = new KinveyRequest({
        method: RequestMethod.POST,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `${this.pathname}/_lookup`
        }),
        properties: options.properties,
        body: isDefined(query) ? query.toPlainObject().filter : null,
        timeout: options.timeout,
        client: this.client
      });

      // Execute the request
      return request.execute()
        .then(response => response.data)
        .then(data => observer.next(data))
        .then(() => observer.complete())
        .catch(error => observer.error(error));
    });
    return stream;
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

    return super.update(data, options);
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
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/rpc/${this.client.appKey}/check-username-exists`
      }),
      properties: options.properties,
      data: { username: username },
      timeout: options.timeout,
      client: this.client
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
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
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
