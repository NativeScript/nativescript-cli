const program = require('commander');
const fs = require('fs');
const os = require('os');
const path = require('path');
const _ = require('lodash');

program
  .option('--platform [type]', 'Add Platform [html5/phonegap/nativescript]')
  .option('--os [type]', 'Add OS [android/ios]')
  .parse(process.argv);

const rootPath = path.join(__dirname, '../');
const integrationTestsFilePath = path.join(rootPath, 'test', 'integration');
const configTemplateFilePath = path.join(integrationTestsFilePath, 'config.template');
const testsConfigFilePath = path.join(integrationTestsFilePath, 'tests-config');

const runnerShimFilePath = path.join(rootPath, 'packages', `kinvey-${program.platform}-sdk`);
const runnerConfigFilePath = path.join(runnerShimFilePath, 'runner-config');
const resultConfigFilePath = path.join(runnerShimFilePath, 'test', 'config.js');


const config = require(testsConfigFilePath);
const testsConfig = config.testsConfig;
const appCredentials = config.appCredentials;

const getCredentialsByEnvironment = (appConfig, platform, os) => {
  const app = appConfig[platform][os] || appConfig[platform];
  return {
    appKey: app.appKey,
    appSecret: app.appSecret
  };
}

const credentialsToUse = getCredentialsByEnvironment(appCredentials, program.platform, program.os);
Object.assign(testsConfig, credentialsToUse);

const crossPlatformExport = fs.readFileSync(configTemplateFilePath, 'utf8');
const compiled = _.template(crossPlatformExport)
const configFileContents = compiled({ 'appConfig': JSON.stringify(testsConfig, null, 2) })
fs.writeFileSync(resultConfigFilePath, configFileContents, 'utf8');

const runPipeline = require(runnerConfigFilePath);
runPipeline(program.os);