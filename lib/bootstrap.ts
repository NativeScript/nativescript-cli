require("./common/bootstrap");
$injector.requirePublicClass("logger", "./common/logger/logger");
$injector.require("config", "./config");
$injector.require("options", "./options");
// note: order above is important!

$injector.requirePublicClass("constants", "./constants-provider");
$injector.require("projectData", "./project-data");
$injector.requirePublic("projectDataService", "./services/project-data-service");
$injector.require("performanceService", "./services/performance-service");
$injector.requirePublic("projectService", "./services/project-service");
$injector.require("androidProjectService", "./services/android-project-service");
$injector.require("androidPluginBuildService", "./services/android-plugin-build-service");
$injector.require("gradleCommandService", "./services/android/gradle-command-service");
$injector.require("gradleBuildService", "./services/android/gradle-build-service");
$injector.require("gradleBuildArgsService", "./services/android/gradle-build-args-service");
$injector.require("iOSEntitlementsService", "./services/ios-entitlements-service");
$injector.require("iOSExtensionsService", "./services/ios-extensions-service");
$injector.require("iOSWatchAppService", "./services/ios-watch-app-service");
$injector.require("iOSProjectService", "./services/ios-project-service");
$injector.require("iOSProvisionService", "./services/ios-provision-service");
$injector.require("xcconfigService", "./services/xcconfig-service");
$injector.require("iOSSigningService", "./services/ios/ios-signing-service");
$injector.require("xcodebuildArgsService", "./services/ios/xcodebuild-args-service");
$injector.require("xcodebuildCommandService", "./services/ios/xcodebuild-command-service");
$injector.require("xcodebuildService", "./services/ios/xcodebuild-service");
$injector.require("exportOptionsPlistService", "./services/ios/export-options-plist-service");

$injector.require("cocoapodsService", "./services/cocoapods-service");
$injector.require("cocoaPodsPlatformManager", "./services/cocoapods-platform-manager");

$injector.require("projectTemplatesService", "./services/project-templates-service");
$injector.require("projectNameService", "./services/project-name-service");
$injector.require("tnsModulesService", "./services/tns-modules-service");

$injector.require("platformsDataService", "./services/platforms-data-service");
$injector.require("addPlatformService", "./services/platform/add-platform-service");
$injector.require("buildInfoFileService", "./services/build-info-file-service");
$injector.require("prepareNativePlatformService", "./services/platform/prepare-native-platform-service");
$injector.require("platformValidationService", "./services/platform/platform-validation-service");

$injector.require("buildArtefactsService", "./services/build-artefacts-service");

$injector.require("deviceInstallAppService", "./services/device/device-install-app-service");

$injector.require("platformController", "./controllers/platform-controller");
$injector.require("prepareController", "./controllers/prepare-controller");
$injector.require("deployController", "./controllers/deploy-controller");
$injector.requirePublicClass("buildController", "./controllers/build-controller");
$injector.requirePublicClass("runController", "./controllers/run-controller");
$injector.requirePublicClass("debugController", "./controllers/debug-controller");
$injector.requirePublicClass("previewAppController", "./controllers/preview-app-controller");
$injector.requirePublicClass("updateController", "./controllers/update-controller");
$injector.requirePublicClass("migrateController", "./controllers/migrate-controller");

$injector.require("prepareDataService", "./services/prepare-data-service");
$injector.require("buildDataService", "./services/build-data-service");

$injector.require("liveSyncServiceResolver", "./resolvers/livesync-service-resolver");

$injector.require("liveSyncProcessDataService", "./services/livesync-process-data-service");
$injector.require("debugDataService", "./services/debug-data-service");
$injector.require("iOSDeviceDebugService", "./services/ios-device-debug-service");
$injector.require("androidDeviceDebugService", "./services/android-device-debug-service");

$injector.require("userSettingsService", "./services/user-settings-service");
$injector.requirePublic("analyticsSettingsService", "./services/analytics-settings-service");
$injector.require("analyticsService", "./services/analytics/analytics-service");
$injector.require("googleAnalyticsProvider", "./services/analytics/google-analytics-provider");

$injector.require("platformCommandParameter", "./platform-command-param");
$injector.requireCommand("create", "./commands/create-project");
$injector.requireCommand("generate", "./commands/generate");
$injector.requireCommand("platform|*list", "./commands/list-platforms");
$injector.requireCommand("platform|add", "./commands/add-platform");
$injector.requireCommand("platform|remove", "./commands/remove-platform");
$injector.requireCommand("platform|update", "./commands/update-platform");
$injector.requireCommand("run|*all", "./commands/run");
$injector.requireCommand("run|ios", "./commands/run");
$injector.requireCommand("run|android", "./commands/run");

$injector.requireCommand("preview", "./commands/preview");

$injector.requireCommand("debug|ios", "./commands/debug");
$injector.requireCommand("debug|android", "./commands/debug");

$injector.requireCommand("prepare", "./commands/prepare");
$injector.requireCommand("build|ios", "./commands/build");
$injector.requireCommand("build|android", "./commands/build");
$injector.requireCommand("deploy", "./commands/deploy");

$injector.require("testExecutionService", "./services/test-execution-service");
$injector.requireCommand("dev-test|android", "./commands/test");
$injector.requireCommand("dev-test|ios", "./commands/test");
$injector.requireCommand("test|android", "./commands/test");
$injector.requireCommand("test|ios", "./commands/test");
$injector.requireCommand("test|init", "./commands/test-init");
$injector.requireCommand("dev-generate-help", "./commands/generate-help");

$injector.requireCommand("appstore|*list", "./commands/appstore-list");
$injector.requireCommand("appstore|upload", "./commands/appstore-upload");
$injector.requireCommand("publish|ios", "./commands/appstore-upload");
$injector.require("itmsTransporterService", "./services/itmstransporter-service");

$injector.requireCommand("setup|*", "./commands/setup");
$injector.requireCommand(["setup|cloud", "cloud|setup"], "./commands/setup");

$injector.requirePublic("packageManager", "./package-manager");
$injector.requirePublic("npm", "./node-package-manager");
$injector.requirePublic("yarn", "./yarn-package-manager");
$injector.requireCommand("package-manager|set", "./commands/package-manager-set");
$injector.requireCommand("package-manager|get", "./commands/package-manager-get");

$injector.require("packageInstallationManager", "./package-installation-manager");

$injector.require("deviceLogProvider", "./common/mobile/device-log-provider");
$injector.require("projectFilesProvider", "./providers/project-files-provider");

$injector.require("nodeModulesBuilder", "./tools/node-modules/node-modules-builder");

$injector.require("pluginVariablesService", "./services/plugin-variables-service");
$injector.require("pluginsService", "./services/plugins-service");
$injector.requireCommand("plugin|*list", "./commands/plugin/list-plugins");
$injector.requireCommand("plugin|add", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|install", "./commands/plugin/add-plugin");
$injector.requireCommand("plugin|remove", "./commands/plugin/remove-plugin");
$injector.requireCommand("plugin|update", "./commands/plugin/update-plugin");
$injector.requireCommand("plugin|build", "./commands/plugin/build-plugin");
$injector.requireCommand("plugin|create", "./commands/plugin/create-plugin");

$injector.require("doctorService", "./services/doctor-service");
$injector.require("xcprojService", "./services/xcproj-service");
$injector.require("versionsService", "./services/versions-service");
$injector.requireCommand("install", "./commands/install");

$injector.require("infoService", "./services/info-service");
$injector.requireCommand("info", "./commands/info");

$injector.require("androidResourcesMigrationService", "./services/android-resources-migration-service");
$injector.requireCommand("resources|update", "./commands/resources/resources-update");

$injector.require("androidToolsInfo", "./android-tools-info");
$injector.require("devicePathProvider", "./device-path-provider");

$injector.requireCommand("platform|clean", "./commands/platform-clean");

$injector.require("bundleValidatorHelper", "./helpers/bundle-validator-helper");
$injector.require("androidBundleValidatorHelper", "./helpers/android-bundle-validator-helper");
$injector.require("liveSyncCommandHelper", "./helpers/livesync-command-helper");
$injector.require("deployCommandHelper", "./helpers/deploy-command-helper");
$injector.require("platformCommandHelper", "./helpers/platform-command-helper");
$injector.require("optionsTracker", "./helpers/options-track-helper");

$injector.requirePublicClass("localBuildService", "./services/local-build-service");
$injector.require("LiveSyncSocket", "./services/livesync/livesync-socket");
$injector.requirePublicClass("androidLivesyncTool", "./services/livesync/android-livesync-tool");
$injector.require("androidLiveSyncService", "./services/livesync/android-livesync-service");
$injector.require("iOSLiveSyncService", "./services/livesync/ios-livesync-service");
$injector.require("usbLiveSyncService", "./services/livesync/livesync-service"); // The name is used in https://github.com/NativeScript/nativescript-dev-typescript
$injector.require("previewAppFilesService", "./services/livesync/playground/preview-app-files-service");
$injector.require("previewAppLogProvider", "./services/livesync/playground/preview-app-log-provider");
$injector.require("previewAppPluginsService", "./services/livesync/playground/preview-app-plugins-service");
$injector.require("previewSdkService", "./services/livesync/playground/preview-sdk-service");
$injector.require("previewSchemaService", "./services/livesync/playground/preview-schema-service");
$injector.requirePublicClass("previewDevicesService", "./services/livesync/playground/devices/preview-devices-service");
$injector.requirePublic("previewQrCodeService", "./services/livesync/playground/preview-qr-code-service");
$injector.requirePublic("sysInfo", "./sys-info");

$injector.require("iOSNotificationService", "./services/ios-notification-service");
$injector.require("appDebugSocketProxyFactory", "./device-sockets/ios/app-debug-socket-proxy-factory");
$injector.require("iOSNotification", "./device-sockets/ios/notification");
$injector.require("iOSSocketRequestExecutor", "./device-sockets/ios/socket-request-executor");
$injector.require("messages", "./common/messages/messages");
$injector.require("xmlValidator", "./xml-validator");

$injector.requireCommand("post-install-cli", "./commands/post-install");
$injector.requireCommand("migrate", "./commands/migrate");
$injector.requireCommand("update", "./commands/update");

$injector.require("iOSLogFilter", "./services/ios-log-filter");
$injector.require("logSourceMapService", "./services/log-source-map-service");
$injector.require("projectChangesService", "./services/project-changes-service");

$injector.require("pbxprojDomXcode", "./node/pbxproj-dom-xcode");
$injector.require("xcode", "./node/xcode");

$injector.require("staticConfig", "./config");

$injector.require("requireService", "./services/require-service");

$injector.requireCommand("extension|*list", "./commands/extensibility/list-extensions");
$injector.requireCommand("extension|install", "./commands/extensibility/install-extension");
$injector.requireCommand("extension|uninstall", "./commands/extensibility/uninstall-extension");
$injector.requirePublicClass("extensibilityService", "./services/extensibility-service");

$injector.require("nodeModulesDependenciesBuilder", "./tools/node-modules/node-modules-dependencies-builder");
$injector.require("subscriptionService", "./services/subscription-service");
$injector.require("terminalSpinnerService", "./services/terminal-spinner-service");

$injector.require('playgroundService', './services/playground-service');
$injector.require("platformEnvironmentRequirements", "./services/platform-environment-requirements");
$injector.require("nativeScriptCloudExtensionService", "./services/nativescript-cloud-extension-service");

$injector.requireCommand("resources|generate|icons", "./commands/generate-assets");
$injector.requireCommand("resources|generate|splashes", "./commands/generate-assets");
$injector.requirePublic("assetsGenerationService", "./services/assets-generation/assets-generation-service");

$injector.require("filesHashService", "./services/files-hash-service");
$injector.require("logParserService", "./services/log-parser-service");
$injector.require("iOSDebuggerPortService", "./services/ios-debugger-port-service");
$injector.require("hmrStatusService", "./services/hmr-status-service");

$injector.require("pacoteService", "./services/pacote-service");
$injector.require("qrCodeTerminalService", "./services/qr-code-terminal-service");
$injector.require("testInitializationService", "./services/test-initialization-service");

$injector.require("networkConnectivityValidator", "./helpers/network-connectivity-validator");
$injector.requirePublic("cleanupService", "./services/cleanup-service");

$injector.require("webpackCompilerService", "./services/webpack/webpack-compiler-service");

$injector.require("applePortalSessionService", "./services/apple-portal/apple-portal-session-service");
$injector.require("applePortalCookieService", "./services/apple-portal/apple-portal-cookie-service");
$injector.require("applePortalApplicationService", "./services/apple-portal/apple-portal-application-service");

$injector.require("watchIgnoreListService", "./services/watch-ignore-list-service");

$injector.requirePublicClass("initializeService", "./services/initialize-service");
