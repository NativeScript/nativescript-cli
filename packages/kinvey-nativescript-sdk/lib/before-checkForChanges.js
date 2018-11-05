const path = require('path');
const fs = require('fs');
const url = require('url');
const pkg = require('../package.json');

module.exports = function (hookArgs) {
  return new Promise((resolve, reject) => {
    const appDirectoryPath = hookArgs && hookArgs.checkForChangesOpts && hookArgs.checkForChangesOpts.projectData && hookArgs.checkForChangesOpts.projectData.appDirectoryPath;

    if (!appDirectoryPath) {
      reject(new Error('Unable to get path to app directory'));
    } else {
      const platform = (hookArgs && hookArgs.checkForChangesOpts && hookArgs.checkForChangesOpts.platform.toLowerCase()) || '';
      const pathToPackageJson = path.join(appDirectoryPath, 'package.json');
      const packageJsonContent = JSON.parse(fs.readFileSync(pathToPackageJson));
      const kinveyData = packageJsonContent.pluginsData && packageJsonContent.pluginsData[pkg.name];
      const redirectUri = kinveyData && kinveyData.config && kinveyData.config.redirectUri;
      const parsedRedirectUri = redirectUri ? url.parse(redirectUri) : {};
      const redirectUriScheme = (parsedRedirectUri.protocol && parsedRedirectUri.protocol.substring(0, parsedRedirectUri.protocol.indexOf(':'))) || undefined;

      if (platform === 'android') {
        const destinationAndroidManifestFile = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.xml');

        if (redirectUriScheme) {
          const micAndroidManifestFile = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.xml.mic');
          const micAndroidManifestFileContent = fs.readFileSync(micAndroidManifestFile).toString().replace(/{redirectUriScheme}/i, redirectUriScheme);
          const currentContent = fs.existsSync(destinationAndroidManifestFile) && fs.readFileSync(destinationAndroidManifestFile).toString();
          if (currentContent !== micAndroidManifestFileContent) {
            fs.writeFileSync(destinationAndroidManifestFile, micAndroidManifestFileContent);
          }
        } else {
          const defaultAndroidManifestFile = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.xml.default');
          const defaultAndroidManifestFileContent = fs.readFileSync(defaultAndroidManifestFile).toString();
          const currentContent = fs.existsSync(destinationAndroidManifestFile) && fs.readFileSync(destinationAndroidManifestFile).toString();
          if (currentContent !== defaultAndroidManifestFileContent) {
            fs.writeFileSync(destinationAndroidManifestFile, defaultAndroidManifestFileContent);
          }
        }
      } else if (platform === 'ios') {
        const destinationInfoPlistFile = path.join(__dirname, '..', 'platforms', 'ios', 'Info.plist');

        if (redirectUriScheme) {
          const micInfoPlistFile = path.join(__dirname, '..', 'platforms', 'ios', 'Info.plist.mic');
          const micInfoPlistFileContent = fs.readFileSync(micInfoPlistFile).toString().replace(/{redirectUriScheme}/i, redirectUriScheme);
          const currentContent = fs.existsSync(destinationInfoPlistFile) && fs.readFileSync(destinationInfoPlistFile).toString();
          if (currentContent !== micInfoPlistFileContent) {
            fs.writeFileSync(destinationInfoPlistFile, micInfoPlistFileContent);
          }
        }
      }

      resolve();
    }
  });
};
