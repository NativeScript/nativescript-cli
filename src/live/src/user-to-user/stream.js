/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "StreamACL" }] */
import { getLiveService } from './live-service';
// TODO: imported for type definitions - is there a better way?
import { StreamACL } from './stream-acl';

/**
 * A Stream, created in the backend
 * @class Stream
 */
export class Stream {
  /** @type {string} */
  name;
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
    return this.liveService.getStreamSubstreams(this.name);
  }

  /**
   * @param {string} substreamOwnerId
   * @param {StreamACL} acl
   */
  setSubstreamACL(substreamOwnerId, acl) {
    return this.liveService.setSubstreamACL(substreamOwnerId, this.name, acl);
  }

  /**
   * @param {string} substreamOwnerId
   */
  requestPublishAccess(substreamOwnerId) {
    return this.liveService.requestSubstreamPublishAccess(this.name, substreamOwnerId)
      .then(this._cacheSubstreamChannel.bind(this));
  }

  /**
   * @param {string} substreamOwnerId
   */
  requestSubscribeAccess(substreamOwnerId) {
    return this.liveService.requestSubstreamSubscribeAccess(this.name, substreamOwnerId)
      .then(this._cacheSubstreamChannel.bind(this));
  }

  /**
   * @param {string} substreamOwnerId
   */
  unsubscribeFromSubstream(substreamOwnerId) {
    return this.liveService.unsubscribeFromSubstream(this.name, substreamOwnerId)
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
}
