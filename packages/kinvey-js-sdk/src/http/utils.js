import isString from 'lodash/isString';
import { format } from 'url';
import { getConfig } from '../client';

export function getKinveyAuthorizationHeader(info) {
  if (!info || !isString(info.scheme)) {
    throw new Error('Please provide valid authorization info. The authorization info must have a scheme that is a string.');
  }

  let { credentials } = info;

  if (isString(info.username) && isString(info.password)) {
    credentials = Buffer.from(`${info.username}:${info.password}`).toString('base64');
  }

  if (!credentials) {
    throw new Error('Please provide valid authorization info. The authorization info must contain either a username and password or credentials.')
  }

  return {
    name: 'Authorization',
    value: `${info.scheme} ${credentials}`
  };
}

export function getKinveyAppAuthorizationHeader() {
  const { appKey, appSecret } = getConfig();
  return getKinveyAuthorizationHeader({
    scheme: 'Basic',
    username: appKey,
    password: appSecret
  });
}

export function getKinveyClientAuthorizationHeader(clientId) {
  const { appSecret } = getConfig();

  if (!isString(clientId)) {
    throw new Error('Please provide a valid clientId. The clientId must be a string.');
  }

  return getKinveyAuthorizationHeader({
    scheme: 'Basic',
    username: clientId,
    password: appSecret
  });
}

export function getKinveySessionAuthorizationHeader(authtoken) {
  if (!authtoken || !isString(authtoken)) {
    throw new Error('Please provide a valid auth token. The auth token must be a string.');
  }

  return getKinveyAuthorizationHeader({
    scheme: 'Kinvey',
    credentials: authtoken
  });
}

export function getKinveyUrl(protocol, host, pathname, query) {
  const { appKey } = getConfig();
  return format({
    protocol,
    host,
    pathname: pathname.replace(/appKey/gi, appKey),
    query
  });
}

export function formatKinveyAuthUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.auth.protocol, api.auth.host, pathname, query);
}

export function formatKinveyBaasUrl(pathname, query) {
  const { api } = getConfig();
  return getKinveyUrl(api.baas.protocol, api.baas.host, pathname, query);
}
