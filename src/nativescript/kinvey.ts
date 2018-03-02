import { Promise } from 'es6-promise';
import * as url from 'url';
import { isDefined } from '../core/utils';
import { KinveyError } from '../core/errors';
import { RequestMethod } from '../core/request';
import { knownFolders, path, File } from 'tns-core-modules/file-system';
import { Client } from './client';

const USERS_NAMESPACE = 'user';
const ACTIVE_USER_COLLECTION_NAME = 'kinvey_active_user';
const PLUGIN_NAME = 'kinvey-nativescript-sdk';

/**
 * Gets settings persisted in package.json file (inside <project dir>/app/package.json)
 * @returns The data from pluginsData['kinvey-nativescript-sdk'].config of app's package.json.
 */
function getDataFromPackageJson(): { appKey: string, appSecret: string, masterSecret: string } {
  try {
    const currentAppDir = knownFolders.currentApp();
    const packageJsonFile = currentAppDir.getFile('package.json');
    const packageJsonData = JSON.parse(packageJsonFile.readTextSync());

    const pluginsData = packageJsonData && packageJsonData.pluginsData;
    const kinveyNativeScriptSdkData = pluginsData && pluginsData[PLUGIN_NAME] && pluginsData[PLUGIN_NAME].config;
    return kinveyNativeScriptSdkData;
  } catch (err) {
    return null;
  }
}

export function init(config = <any>{}) {
  const configFromPackageJson = getDataFromPackageJson() || <any>{};

  config.appKey = config.appKey || configFromPackageJson.appKey;
  config.appSecret = config.appSecret || configFromPackageJson.appSecret;
  config.masterSecret = config.masterSecret || configFromPackageJson.masterSecret;

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

export function initialize(config) {
  const client = init(config);
  return Promise.resolve(client.getActiveUser());
}
