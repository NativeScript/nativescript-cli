/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "StreamACL" }] */
import { getLiveService } from './live-service';
// TODO: imported for type definitions - is there a better way?
import { StreamACL } from './stream-acl';

/**
 * @class Stream
 * @classdesc A Stream, created in the backend
 */
export class Stream {
  /** @type {string} */
  name;
  liveService = getLiveService(this.client);

  /**
   * @constructor
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * @param  {string} streamOwnerId
   * @param  {StreamACL} acl
   */
  grantStreamAccess(streamOwnerId, acl) {
    return this.liveService.setSubstreamACL(streamOwnerId, this.name, acl);
  }
}
