import Promise from 'es6-promise';
import UrlPattern from 'url-pattern';
import url from 'url';
import localStorage from 'local-storage';
import cloneDeep from 'lodash/cloneDeep';

import Client from 'src/client';
import { KinveyError, NotFoundError } from 'src/errors';
import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { isDefined } from 'src/utils';
import Request, { RequestMethod } from './request';
import { KinveyResponse } from './response';
import { CacheRack } from './rack';

const activeUsers = {};

/**
 * @private
 */
export default class CacheRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.aggregation = options.aggregation;
    this.query = options.query;
    this.rack = CacheRack;
  }

  get body() {
    return this._body;
  }

  set body(body) {
    this._body = cloneDeep(body);
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
    const pathname = global.decodeURIComponent(url.parse(urlString).pathname);
    const urlParts = pathname.replace(/^\//, '').split('/');
    // "pathname" has the following form: "/namespace/appKey/collection/id"
    this.appKey = urlParts[1];
    this.collection = urlParts[2];
    this.entityId = urlParts[3];
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
    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: `${client.apiHostname}/user/${client.appKey}/kinvey_active_user`
    });
    return request.execute()
      .then(response => response.data)
      .then((users) => {
        if (users.length > 0) {
          return users[0];
        }

        return null;
      })
      .then((activeUser) => {
        // Try local storage
        if (isDefined(activeUser) === false) {
          return CacheRequest.loadActiveUserLegacy(client);
        }

        return activeUser;
      })
      .then((activeUser) => {
        return CacheRequest.setActiveUser(client, activeUser);
      })
      .then((activeUser) => {
        activeUsers[client.appKey] = activeUser;
        return activeUser;
      });
  }

  static loadActiveUserLegacy(client = Client.sharedInstance()) {
    const activeUser = CacheRequest.getActiveUserLegacy(client);
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
    const activeUser = CacheRequest.getActiveUser(client);

    if (isDefined(activeUser)) {
      // Delete from local storage (legacy)
      CacheRequest.setActiveUserLegacy(client, null);

      // Delete from memory
      activeUsers[client.appKey] = null;

      // Delete from cache
      const request = new CacheRequest({
        method: RequestMethod.DELETE,
        url: `${client.apiHostname}/user/${client.appKey}/kinvey_active_user/${activeUser._id}`
      });
      promise = request.execute()
        .then(response => response.data)
        .catch((error) => {
          if (error instanceof NotFoundError) {
            return null;
          }

          throw error;
        });
    }

    return promise
      .then(() => {
        if (isDefined(user) === false) {
          return null;
        }

        // Remove sensitive data from user
        delete user.password;

        // Save to memory
        activeUsers[client.appKey] = user;

        // Save to local storage (legacy)
        CacheRequest.setActiveUserLegacy(client, user);

        // Save to cache
        const request = new CacheRequest({
          method: RequestMethod.POST,
          url: `${client.apiHostname}/user/${client.appKey}/kinvey_active_user`,
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
