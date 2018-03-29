
const testsConfig = {
  collectionName: 'Books',
  fbEmail: process.env.FACEBOOK_EMAIL,
  fbPassword: process.env.FACEBOOK_PASSWORD,
  authServiceId: 'decad9197f0f4680a46d902327c5c131'
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
