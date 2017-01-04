import Request, { RequestMethod } from './request';
import { Client } from '../../client';
import { KinveyResponse } from './response';
import UrlPattern from 'url-pattern';
import url from 'url';
import localStorage from 'local-storage';
import { KinveyError } from '../../errors';
import Query from '../../query';
import Aggregation from '../../aggregation';
import Promise from 'es6-promise';
import { isDefined } from '../../utils';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const activeUserCollectionName = process.env.KINVEY_USER_ACTIVE_COLLECTION_NAME || 'kinvey_active_user';
const activeUsers = {};

/**
 * @private
 */
export default class LocalRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.aggregation = options.aggregation;
    this.query = options.query;

    if (isDefined(global._KinveyCacheRack) === false) {
      throw new Error('_KinveyCacheRack is not defined. Unable to create a CacheRequest.');
    }

    this.rack = new global._KinveyCacheRack();
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (isDefined(query) && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    this._query = query;
  }

  get aggregation() {
    return this._aggregation;
  }

  set aggregation(aggregation) {
    if (isDefined(aggregation) && !(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    this._aggregation = aggregation;
  }

  get url() {
    return super.url;
  }

  set url(urlString) {
    super.url = urlString;
    const pathname = global.escape(url.parse(urlString).pathname);
    const pattern = new UrlPattern('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');
    const { appKey, collection, entityId } = pattern.match(pathname) || {};
    this.appKey = appKey;
    this.collection = collection;
    this.entityId = entityId;
  }

  execute() {
    return super.execute()
      .then((response) => {
        if (!(response instanceof KinveyResponse)) {
          response = new KinveyResponse({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        // Throw the response error if we did not receive
        // a successfull response
        if (!response.isSuccess()) {
          throw response.error;
        }

        // If a query was provided then process the data with the query
        if (isDefined(this.query) && isDefined(response.data)) {
          response.data = this.query.process(response.data);
        }

        // If an aggregation was provided then process the data with the aggregation
        if (isDefined(this.aggregation) && isDefined(response.data)) {
          response.data = this.aggregation.process(response.data);
        }

        // Just return the response
        return response;
      });
  }

  toPlainObject() {
    const obj = super.toPlainObject();
    obj.appKey = this.appKey;
    obj.collection = this.collection;
    obj.entityId = this.entityId;
    obj.encryptionKey = this.client ? this.client.encryptionKey : undefined;
    return obj;
  }

  static loadActiveUser(client = Client.sharedInstance()) {
    const request = new LocalRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: client.protocol,
        host: client.host,
        pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}`
      })
    });
    return request.execute()
      .then(response => response.data)
      .then((users) => {
        if (users.length > 0) {
          return users[0];
        }

        // Try local storage (legacy)
        const legacyActiveUser = LocalRequest.loadActiveUserLegacy(client);
        if (isDefined(legacyActiveUser)) {
          return LocalRequest.setActiveUser(client, legacyActiveUser);
        }

        return null;
      })
      .then((activeUser) => {
        activeUsers[client.appKey] = activeUser;
        return activeUser;
      })
      .catch(() => null);
  }

  static loadActiveUserLegacy(client = Client.sharedInstance()) {
    const activeUser = LocalRequest.getActiveUserLegacy(client);
    activeUsers[client.appKey] = activeUser;
    return activeUser;
  }

  static getActiveUser(client = Client.sharedInstance()) {
    return activeUsers[client.appKey];
  }

  static getActiveUserLegacy(client = Client.sharedInstance()) {
    try {
      return localStorage.get(`${client.appKey}kinvey_user`);
    } catch (error) {
      return null;
    }
  }

  static setActiveUser(client = Client.sharedInstance(), user) {
    let promise = Promise.resolve(null);
    const activeUser = LocalRequest.getActiveUser(client);

    if (isDefined(activeUser)) {
      // Delete from local storage (legacy)
      LocalRequest.setActiveUserLegacy(client, null);

      // Delete from memory
      activeUsers[client.appKey] = null;

      // Delete from cache
      const request = new LocalRequest({
        method: RequestMethod.DELETE,
        url: url.format({
          protocol: client.protocol,
          host: client.host,
          pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}/${activeUser._id}`
        })
      });
      promise = request.execute()
        .then(response => response.data);
    }

    return promise
      .then(() => {
        if (isDefined(user) === false) {
          return null;
        }

        // Save to memory
        activeUsers[client.appKey] = user;

        // Save to local storage (legacy)
        LocalRequest.setActiveUserLegacy(client, user);

        // Save to cache
        const request = new LocalRequest({
          method: RequestMethod.POST,
          url: url.format({
            protocol: client.protocol,
            host: client.host,
            pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}`
          }),
          body: user
        });
        return request.execute()
          .then(response => response.data);
      })
      .then(() => user);
  }

  static setActiveUserLegacy(client = Client.sharedInstance(), user) {
    try {
      localStorage.remove(`${client.appKey}kinvey_user`);

      if (isDefined(user)) {
        localStorage.set(`${client.appKey}kinvey_user`, user);
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
