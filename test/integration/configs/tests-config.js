const testsConfig = {
  collectionName: 'Books',
  deltaCollectionName: 'BooksDelta',
  fbEmail: process.env.FACEBOOK_EMAIL,
  fbPassword: process.env.FACEBOOK_PASSWORD,
  authServiceId: 'af8e35a15aba4c369de921cc9d837e96',
  wrongSetupAuthServiceId: '82c61e6711e547e69ea5153cbe9bb854'
};

const appCredentials = {
  html5: {
    appKey: 'kid_SykZReklX',
    appSecret: 'adc893c7824e4c8caa4b33027a2ff883',
    masterSecret: '82c0da2d48bc4a829a0e44629f39a7ab'
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
