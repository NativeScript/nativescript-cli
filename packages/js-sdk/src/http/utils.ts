import { format } from 'url';
import urlJoin from 'url-join';
import isPlainObject from 'lodash/isPlainObject';
import { getBaasProtocol, getBaasHost, getAuthProtocol, getAuthHost, getAppKey } from '../kinvey'

function clean(value: { [key: string]: any }) {
  return Object.keys(value)
    .reduce((cleanVal: { [key: string]: any }, key) => {
      let objVal = value[key];

      if (isPlainObject(objVal)) {
        objVal = clean(objVal);
      }

      if (typeof objVal !== 'undefined' && objVal !== null) {
        cleanVal[key] = objVal;
      }

      return cleanVal;
    }, {});
}

export enum KinveyBaasNamespace {
  AppData = 'appdata',
  Blob = 'blob',
  Push = 'push',
  Rpc = 'rpc',
  User = 'user'
}

export function formatKinveyBaasUrl(namespace: KinveyBaasNamespace, path?: string, query?: { [key: string]: any }) {
  return format({
    protocol: getBaasProtocol(),
    host: getBaasHost(),
    pathname: path ? urlJoin(namespace, getAppKey(), path) : urlJoin(namespace, getAppKey()),
    query: query ? clean(query) : undefined
  });
}

export function formatKinveyAuthUrl(path?: string, query?: { [key: string]: any }) {
  return format({
    protocol: getAuthProtocol(),
    host: getAuthHost(),
    pathname: path,
    query: query ? clean(query) : undefined
  });
}
