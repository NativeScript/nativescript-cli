import nock from 'nock';

import Client from '../../../src/client'; // imported for type info

import { StreamACL } from '../../../src/live';

/** @type {Client} */
let _client;

function _baseNockCall() {
  return nock(_client.apiHostname, { encodedQueryParams: true });
}

function _buildStreamUrl(streamName, path) {
  return `/stream/${_client.appKey}/${streamName}/${path}`;
}

function _buildSubstreamACLUrl(streamName, substreamId) {
  return _buildStreamUrl(streamName, substreamId);
}

export function setClient(client) {
  _client = client;
}

export function mockRegisterRealtimeCall(response) {
  return _baseNockCall()
    .post(`/user/${_client.appKey}/${_client.activeUser._id}/register-realtime`, { deviceId: _client.deviceId })
    .reply(200, response);
}

export function mockUnregisterRealtimeCall() {
  return _baseNockCall()
    .post(`/user/${_client.appKey}/${_client.activeUser._id}/unregister-realtime`, { deviceId: _client.deviceId })
    .reply(204);
}

export function mockSubstreamsRequest(streamName, response) {
  const url = _buildStreamUrl(streamName, '_substreams');
  return _baseNockCall()
    .get(url)
    .reply(200, response);
}

export function mockSetStreamACLRequest(streamName, substreamId, aclObj) {
  return _baseNockCall()
    .put(_buildSubstreamACLUrl(streamName, substreamId), (suppliedBody) => {
      const acl = new StreamACL(suppliedBody);
      return acl.isNotEmpty();
    })
    .reply(200, (url, reqBody) => {
      return new StreamACL(aclObj)
        .toPlainObject();
    });
}
