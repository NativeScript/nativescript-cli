module.exports = function ($logger, hookArgs) {
  const platform = hookArgs && hookArgs.config && hookArgs.config.platform && hookArgs.config.platform.toLowerCase();
  const projectIdentifier = platform && hookArgs.projectData && hookArgs.projectData.projectIdentifiers && hookArgs.projectData.projectIdentifiers[platform];
  const previewScheme = projectIdentifier === 'com.kinvey.preview' ? 'kspreviewresume://' : 'nsplayresume://';
  $logger.warn(`If you are using loginWithMIC() ensure that you have added ${previewScheme} as a Redirect URI to your Mobile Identity Connect configuration at https://console.kinvey.com in order for Mobile Identity Connect login to work in the Preview app.`);
};
