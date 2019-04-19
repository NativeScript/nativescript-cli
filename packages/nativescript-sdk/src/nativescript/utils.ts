import { knownFolders } from 'tns-core-modules/file-system';

export function getDataFromPackageJson() {
  try {
    const currentAppDir = knownFolders.currentApp();
    const packageJsonFile = currentAppDir.getFile('package.json');
    const packageJsonData = JSON.parse(packageJsonFile.readTextSync());

    const pluginsData = packageJsonData && packageJsonData.pluginsData;
    const kinveyNativeScriptSdkData = pluginsData && pluginsData['kinvey-nativescript-sdk'] && pluginsData['kinvey-nativescript-sdk'].config;
    return kinveyNativeScriptSdkData;
  } catch (err) {
    return null;
  }
}
