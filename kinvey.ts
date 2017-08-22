import { Promise } from 'es6-promise';
import url from 'url';
import {
  Kinvey as CoreKinvey,
  isDefined,
  KinveyError,
  CacheRequest,
  RequestMethod
} from 'kinvey-js-sdk/dist/export';
import { Client } from './client';

const USERS_NAMESPACE = 'user';
const ACTIVE_USER_COLLECTION_NAME = 'kinvey_active_user';

interface ClientConfig {
  apiHostname?: string,
  micHostname?: string,
  liveServiceHostname?: string,
  appKey: string,
  appSecret?: string,
  masterSecret?: string,
  encryptionKey?: string,
  defaultTimeout?: number
}

export class Kinvey extends CoreKinvey {
  static initialize(config) {
    const client = Kinvey.init(config);
    return Promise.resolve(client.getActiveUser());
  }

  static init(config = <ClientConfig>{}) {
    if (!isDefined(config.appKey)) {
      throw new KinveyError('No App Key was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    if (!isDefined(config.appSecret) && !isDefined(config.masterSecret)) {
      throw new KinveyError('No App Secret or Master Secret was provided.'
        + ' Unable to create a new Client without an App Secret.');
    }

    return Client.init(config);
  }
}
