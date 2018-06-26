const path = require('path');
const fs = require('fs');
const pkg = require('../package.json');

module.exports = function (hookArgs) {
  const appDirectoryPath = hookArgs && hookArgs.projectData && hookArgs.projectData.appDirectoryPath;

  if (!appDirectoryPath) {
    throw new Error('Unable to get path to app directory');
  }

  const packageJsonContent = JSON.parse(fs.readFileSync(path.join(appDirectoryPath, 'package.json')));
  const kinveyData = packageJsonContent.pluginsData && packageJsonContent.pluginsData[pkg.name];
  const redirectUri = (kinveyData && kinveyData.config && kinveyData.config.redirectUri) || 'enterpriseauth';

  if (hookArgs.platform.toLowerCase() === 'android') {
    const androidManifestPath = path.join(__dirname, '..', 'platforms', 'android', 'AndroidManifest.xml');
    let content = fs.readFileSync(androidManifestPath).toString();
    content = content.replace(/{redirectUri}/i, redirectUri);
    fs.writeFileSync(androidManifestPath, content);
  } else if (hookArgs.platform.toLowerCase() === 'ios') {
    const infoPlistPath = path.join(__dirname, '..', 'platforms', 'ios', 'Info.plist');
    let content = fs.readFileSync(infoPlistPath).toString();
    content = content.replace(/{redirectUri}/i, redirectUri);
    fs.writeFileSync(infoPlistPath, content);
  }
};
