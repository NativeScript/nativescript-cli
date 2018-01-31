const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

const rootPath = path.join(__dirname, '../../');
const integrationTestsFilePath = path.join(rootPath, 'test', 'integration');
const configTemplateFilePath = path.join(integrationTestsFilePath, 'configs', 'config.template');
const testsConfigFilePath = path.join(integrationTestsFilePath, 'configs', 'tests-config');
const config = require(testsConfigFilePath);
const testsConfig = config.testsConfig;
const appCredentials = config.appCredentials;
const crossPlatformExport = fs.readFileSync(configTemplateFilePath, 'utf8');
const compiled = lodash.template(crossPlatformExport);

const getCredentialsByEnvironment = (appConfig, platform, os) => {
  const app = appConfig[platform][os] || appConfig[platform];
  return {
    appKey: app.appKey,
    appSecret: app.appSecret
  };
};

const createPlatformSpecificConfig = (platform, os) => {
  const resultConfigFilePath = path.join(rootPath, 'packages', `kinvey-${platform}-sdk`, 'test', 'config.js');
  const credentialsToUse = getCredentialsByEnvironment(appCredentials, platform, os);
  Object.assign(testsConfig, credentialsToUse);
  const configFileContents = compiled({ appConfig: JSON.stringify(testsConfig, null, 2) });
  
  fs.writeFileSync(resultConfigFilePath, configFileContents, 'utf8');
};

module.exports = createPlatformSpecificConfig;
