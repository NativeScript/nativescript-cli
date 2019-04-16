module.exports = function ($logger, hookArgs) {
  const previewAppSchema = hookArgs && hookArgs.projectData && hookArgs.projectData.previewAppSchema;
  const previewResumeScheme = previewAppSchema === "kspreview" ? "kspreviewresume://" : "nsplayresume://";

  $logger.warn(`If you are using loginWithMIC() ensure that you have added ${previewResumeScheme} as a Redirect URI to your Mobile Identity Connect configuration at https://console.kinvey.com in order for Mobile Identity Connect login to work in the Preview app.`);
};
