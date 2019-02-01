/* eslint-disable import/prefer-default-export */
import { knownFolders } from 'tns-core-modules/file-system';

const PLUGIN_NAME = 'kinvey-nativescript-sdk';

export function getDataFromPackageJson() {
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
