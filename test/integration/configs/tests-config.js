
const testsConfig = {
  collectionName: 'Books',
  collectionWithPreSaveHook: 'WithPreSaveHook',
  propertyFromBLName: 'propertyFromBL',
  propertyFromBLValue: true
};

const appCredentials = {
  html5: {
    appKey: 'kid_H1fs4gFsZ',
    appSecret: 'aa42a6d47d0049129c985bfb37821877'
  },
  nativescript: {
    android: {
      appKey: 'kid_ryEW0UQrM',
      appSecret: '5a006e23a102442884dc9de5d2d2abc9',
    },
    ios: {
      appKey: 'kid_By6pBd7BG',
      appSecret: '7568820462ce40eeb1f56ec01a4cf2ae',
    }
  },
  phonegap: {
    android: {
      appKey: 'kid_SyP_lFXBz',
      appSecret: '997be7e8aae142fb89796352dc57b5be',
    },
    ios: {
      appKey: 'kid_SyqplFXrz',
      appSecret: 'c00090630ace4eb3956367a44319afcf',
    }
  }
};

module.exports = {
  testsConfig: testsConfig,
  appCredentials: appCredentials
};
