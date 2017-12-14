before(() => {
  Kinvey.init({
    appKey: externalConfig.appKey,
    appSecret: externalConfig.appSecret
  });
})