import nock from 'nock';

import Client from '../../../src/client'; // imported for type info

/** @type {Client} */
let _client;

function baseNockCall() {
  return nock(_client.apiHostname, { encodedQueryParams: true });
}

export function setClient(client) {
  _client = client;
}

export function mockRegisterRealtimeCall(response) {
  return baseNockCall()
    .post(`/user/${_client.appKey}/${_client.activeUser._id}/register-realtime`, { deviceId: _client.deviceId })
    .reply(200, response);
}

export function mockUnregisterRealtimeCall() {
  return baseNockCall()
    .post(`/user/${_client.appKey}/${_client.activeUser._id}/unregister-realtime`, { deviceId: _client.deviceId })
    .reply(204);
}
