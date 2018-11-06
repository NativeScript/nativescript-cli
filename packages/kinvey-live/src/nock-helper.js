import nock from 'nock';

import { init } from 'kinvey-app';

let _client;

function _baseNockCall() {
  setClient(Client.sharedInstance());
  return nock(_client.apiHostname, { encodedQueryParams: true });
}

function _buildStreamUrl(streamName, path) {
  return `/stream/${_client.appKey}/${streamName}/${path}`;
}

function _buildCollectionSubscriptionUrl(collectionName, path) {
  return `/appdata/${_client.appKey}/${collectionName}/${path}`;
}

/**
 * @private
 */
export function setClient(client) {
  _client = client;
}

/**
 * @private
 */
export function mockRegisterRealtimeCall(response) {
  return _baseNockCall()
    .post(`/user/${_client.appKey}/${_client.getActiveUser()._id}/register-realtime`, { deviceId: _client.deviceId })
    .reply(200, response);
}

/**
 * @private
 */
export function mockUnregisterRealtimeCall() {
  return _baseNockCall()
    .post(`/user/${_client.appKey}/${_client.getActiveUser()._id}/unregister-realtime`, { deviceId: _client.deviceId })
    .reply(204);
}

/**
 * @private
 */
export function mockSubstreamsRequest(streamName, response) {
  const url = _buildStreamUrl(streamName, '_substreams');
  return _baseNockCall()
    .get(url)
    .reply(200, response);
}

/**
 * @private
 */
export function mockCollectionSubscribeRequest(collectionName) {
  return _baseNockCall()
    .post(_buildCollectionSubscriptionUrl(collectionName, '_subscribe'), { deviceId: _client.deviceId })
    .reply(204);
}

/**
 * @private
 */
export function mockCollectionUnsubscribeRequest(collectionName) {
  return _baseNockCall()
    .post(_buildCollectionSubscriptionUrl(collectionName, '_unsubscribe'), { deviceId: _client.deviceId })
    .reply(204);
}
