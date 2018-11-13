
const testsConfig = {
  collectionName: 'Books',
  deltaCollectionName: 'BooksDelta',
  fbEmail: process.env.FACEBOOK_EMAIL,
  fbPassword: process.env.FACEBOOK_PASSWORD,
  authServiceId: '6caa6cb682c645708ae7cf2c21b252db',
  wrongSetupAuthServiceId: '8a44482f4b12486593b05e3141f9abf9'
};

const appCredentials = {
  html5: {
    appKey: process.env.HTML5_APP_KEY,
    appSecret: process.env.HTML5_APP_SECRET,
    masterSecret: process.env.HTML5_MASTER_SECRET
  },
  nativescript: {
    android: {
      appKey: process.env.NS_ANDROID_APP_KEY,
      appSecret: process.env.NS_ANDROID_APP_SECRET,
      masterSecret: process.env.NS_ANDROID_MASTER_SECRET
    },
    ios: {
      appKey: process.env.NS_IOS_APP_KEY,
      appSecret: process.env.NS_IOS_APP_SECRET,
      masterSecret: process.env.NS_IOS_MASTER_SECRET
    }
  },
  phonegap: {
    android: {
      appKey: process.env.PG_ANDROID_APP_KEY,
      appSecret: process.env.PG_ANDROID_APP_SECRET,
      masterSecret: process.env.PG_ANDROID_MASTER_SECRET
    },
    ios: {
      appKey: process.env.PG_IOS_APP_KEY,
      appSecret: process.env.PG_IOS_APP_SECRET,
      masterSecret: process.env.PG_IOS_MASTER_SECRET
    }
  }
};

module.exports = {
  testsConfig: testsConfig,
  appCredentials: appCredentials
};
