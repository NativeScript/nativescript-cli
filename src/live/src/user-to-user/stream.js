import url from 'url';
import Client from '../../../client';
import { getLiveService } from './live-service';
import { KinveyRequest, RequestMethod, AuthType } from '../../../request';
import { StreamACL } from './stream-acl';

/**
 * A Stream, created in the backend
 * @class Stream
 */
export class Stream {
  /** @type {string} */
  name;
  client = Client.sharedInstance();
  liveService = getLiveService(this.client);
  channelSubscriptions = {};

  /**
   * @constructor
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  getSubstreams() {
    const request = this._getStreamRequestObject('_substreams', RequestMethod.GET);

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} substreamOwnerId
   * @param {StreamACL} acl
   * @returns {Promise} Response promise
   */
  setSubstreamACL(substreamOwnerId, acl) {
    const requestBody = (acl instanceof StreamACL) ? acl.toPlainObject() : acl;
    const request = this._getStreamRequestObject(`${substreamOwnerId}`, RequestMethod.PUT, requestBody);

    return request.execute()
      .then(response => response.data);
  }

  /**
   * @param {string} substreamOwnerId
   */
  requestPublishAccess(substreamOwnerId) {
    const request = this._getStreamRequestObject(`${substreamOwnerId}/publish`, RequestMethod.POST);

    return request.execute()
      .then(response => response.data)
      .then(this._cacheSubstreamChannel.bind(this));
  }

  /**
   * @param {string} substreamOwnerId
   */
  requestSubscribeAccess(substreamOwnerId) {
    const requestBody = { deviceId: this.client.deviceId };
    const request = this._getStreamRequestObject(`${substreamOwnerId}/subscribe`, RequestMethod.POST, requestBody);

    return request.execute()
      .then(response => response.data)
      .then(this._cacheSubstreamChannel.bind(this));
  }

  /**
   * @param {string} substreamOwnerId
   */
  unsubscribe(substreamOwnerId) {
    const path = `${substreamOwnerId}/unsubscribe`;
    const request = this._getStreamRequestObject(path, RequestMethod.POST, { deviceId: this.client.deviceId });

    return request.execute()
      .then(response => response.data)
      .then(() => {
        delete this.channelSubscriptions[substreamOwnerId];
      });
  }

  listen() {

  }

  send() {

  }

  /**
   * @private
   */
  _cacheSubstreamChannel(accessRequestResponse, substreamOwnerId) {
    this.channelSubscriptions[substreamOwnerId] = accessRequestResponse.substreamChannelName;
    return accessRequestResponse;
  }

  /**
   * @private
   * @param {string} path The path after the stream/kid part
   * @param {RequestMethod} method The request method to be used
   * @param {Object} [body] The body of the request, if applicable
   * @returns {Promise}
   */
  _getStreamRequestObject(path, method, body) {
    const request = new KinveyRequest({
      method: method,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/stream/${this.client.appKey}/${this.name}/${path}`
      }),
      body: body
    });

    return request;
  }
}
