import Promise from 'es6-promise';
import Queue from 'promise-queue';
import url from 'url';
import cloneDeep from 'lodash/cloneDeep';

import Client from 'src/client';
import { KinveyError } from 'src/errors';
import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { isDefined } from 'src/utils';
import Request, { RequestMethod } from './request';
import { KinveyResponse } from './response';
import { CacheRack } from './rack';

const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const activeUserCollectionName = process.env.KINVEY_USER_ACTIVE_COLLECTION_NAME || 'kinvey_active_user';
const activeUsers = {};

Queue.configure(Promise);
const queue = new Queue(1, Infinity);

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
    return queue.add(() => {
      const request = new CacheRequest({
        method: RequestMethod.GET,
        url: url.format({
          protocol: client.apiProtocol,
          host: client.apiHost,
          pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}`
        })
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
          activeUsers[client.appKey] = activeUser;
          return activeUser;
        });
    });
  }

  static getActiveUser(client = Client.sharedInstance()) {
    return activeUsers[client.appKey];
  }

  static setActiveUser(client = Client.sharedInstance(), activeUser) {
    return queue.add(() => {
      let promise = Promise.resolve(null);
      const prevActiveUser = CacheRequest.getActiveUser(client);

      if (isDefined(activeUser)) {
        // Remove sensitive data from activeUser
        delete activeUser.password;

        // Save to memory
        activeUsers[client.appKey] = activeUser;

        // Save to cache
        const request = new CacheRequest({
          method: RequestMethod.POST,
          url: url.format({
            protocol: client.apiProtocol,
            host: client.apiHost,
            pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}`
          }),
          body: activeUser
        });
        promise = request.execute()
          .then(response => response.data);
      } else {
        // Delete from memory
        delete activeUsers[client.appKey];
      }

      return promise
        .then(() => {
          if (isDefined(prevActiveUser) && (isDefined(activeUser) === false || prevActiveUser._id !== activeUser._id)) {
            // Delete from cache
            const request = new CacheRequest({
              method: RequestMethod.DELETE,
              url: url.format({
                protocol: client.apiProtocol,
                host: client.apiHost,
                pathname: `/${usersNamespace}/${client.appKey}/${activeUserCollectionName}/${prevActiveUser._id}`
              })
            });
            return request.execute()
              .catch(() => activeUser);
          }

          return activeUser;
        })
        .then(() => activeUser);
    });
  }
}
