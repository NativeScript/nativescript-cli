const path = require('path');
const fs = require('fs');
const url = require('url');
const pkg = require('../package.json');

module.exports = function (hookArgs) {
  const appDirectoryPath = hookArgs && hookArgs.checkForChangesOpts && hookArgs.checkForChangesOpts.projectData && hookArgs.checkForChangesOpts.projectData.appDirectoryPath;

  if (!appDirectoryPath) {
    throw new Error('Unable to get path to app directory');
  }

  const platform = hookArgs && hookArgs.checkForChangesOpts && hookArgs.checkForChangesOpts.platform || "";
  const pathToPackageJson = path.join(appDirectoryPath, 'package.json');
  const packageJsonContent = JSON.parse(fs.readFileSync(pathToPackageJson));
  const kinveyData = packageJsonContent.pluginsData && packageJsonContent.pluginsData[pkg.name];
  const redirectUri = (kinveyData && kinveyData.config && kinveyData.config.redirectUri);

  if (redirectUri) {
    const parsedRedirectUri = url.parse(redirectUri);
    const redirectUriScheme = parsedRedirectUri.protocol && parsedRedirectUri.protocol.substring(0, parsedRedirectUri.protocol.indexOf(':'));

    if (!redirectUriScheme) {
      throw new Error(`Unable to find correct redirectUri scheme in ${pathToPackageJson}`);
    }

    if (platform.toLowerCase() === 'android') {
      const androidManifestPath = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.default.xml');
      let content = fs.readFileSync(androidManifestPath).toString();
      content = content.replace(/{redirectUriScheme}/i, redirectUriScheme);
      const destinationFile = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.xml');
      const currentContent = fs.existsSync(destinationFile) && fs.readFileSync(destinationFile).toString();
      if (currentContent !== content) {
        fs.writeFileSync(destinationFile, content);
      }
    } else if (platform.toLowerCase() === 'ios') {
      const infoPlistPath = path.join(__dirname, '..', 'platforms', 'ios', 'Info.default.plist');
      let content = fs.readFileSync(infoPlistPath).toString();
      content = content.replace(/{redirectUriScheme}/i, redirectUriScheme);
      const destinationFile = path.join(__dirname, '..', 'platforms', 'ios', 'Info.plist');
      const currentContent = fs.existsSync(destinationFile) && fs.readFileSync(destinationFile).toString();
      if (currentContent !== content) {
        fs.writeFileSync(destinationFile, content);
      }
    }
  }
};
