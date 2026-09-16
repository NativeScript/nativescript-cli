import { injector } from "./common/yok";
import { registerBuiltInCommand } from "./common/services/command-definition-adapter";
import type { fontsCommandDefinition } from "./commands/fonts";

require("./common/bootstrap");

/**
 * The CLI owns every name it registers here, so a refusal is a mistake in this
 * file rather than a condition to report and carry on from, the way a
 * conflicting extension is.
 */
injector.requirePublicClass("logger", "./common/logger/logger");
injector.require("config", "./config");
injector.require("options", "./options");
// note: order above is important!

injector.requirePublicClass("constants", "./constants-provider");
injector.require("projectData", "./project-data");
injector.requirePublic("projectDataService", "./services/project-data-service");
injector.requirePublic(
	"projectBackupService",
	"./services/project-backup-service",
);
injector.requirePublic(
	"projectCleanupService",
	"./services/project-cleanup-service",
);
injector.requirePublic(
	"projectConfigService",
	"./services/project-config-service",
);
injector.require("performanceService", "./services/performance-service");
injector.requirePublic("projectService", "./services/project-service");
injector.require("androidProjectService", "./services/android-project-service");
injector.require(
	"androidPluginBuildService",
	"./services/android-plugin-build-service",
);
injector.require(
	"gradleCommandService",
	"./services/android/gradle-command-service",
);
injector.require(
	"gradleBuildService",
	"./services/android/gradle-build-service",
);
injector.require(
	"gradleBuildArgsService",
	"./services/android/gradle-build-args-service",
);
injector.require(
	"androidBundleToolService",
	"./services/android/android-bundle-tool-service",
);
injector.require(
	"iOSEntitlementsService",
	"./services/ios-entitlements-service",
);
injector.require(
	"iOSNativeTargetService",
	"./services/ios-native-target-service",
);
injector.require("iOSExtensionsService", "./services/ios-extensions-service");
injector.require("iOSWatchAppService", "./services/ios-watch-app-service");
injector.require("iOSProjectService", "./services/ios-project-service");
injector.require("iOSProvisionService", "./services/ios-provision-service");
injector.require("xcconfigService", "./services/xcconfig-service");
injector.require("iOSSigningService", "./services/ios/ios-signing-service");
injector.require("spmService", "./services/ios/spm-service");
injector.require("spmPbxprojService", "./services/ios/spm-pbxproj-service");
injector.require(
	"xcodebuildArgsService",
	"./services/ios/xcodebuild-args-service",
);
injector.require(
	"xcodebuildCommandService",
	"./services/ios/xcodebuild-command-service",
);
injector.require("xcodebuildService", "./services/ios/xcodebuild-service");
injector.require(
	"exportOptionsPlistService",
	"./services/ios/export-options-plist-service",
);

injector.require("cocoapodsService", "./services/cocoapods-service");
injector.require(
	"cocoaPodsPlatformManager",
	"./services/cocoapods-platform-manager",
);

injector.require(
	"projectTemplatesService",
	"./services/project-templates-service",
);
injector.require("projectNameService", "./services/project-name-service");
injector.require("tnsModulesService", "./services/tns-modules-service");

injector.require("platformsDataService", "./services/platforms-data-service");
injector.require(
	"addPlatformService",
	"./services/platform/add-platform-service",
);
injector.require("buildInfoFileService", "./services/build-info-file-service");
injector.require(
	"prepareNativePlatformService",
	"./services/platform/prepare-native-platform-service",
);
injector.require(
	"platformValidationService",
	"./services/platform/platform-validation-service",
);

injector.require("buildArtifactsService", "./services/build-artifacts-service");

injector.require(
	"deviceInstallAppService",
	"./services/device/device-install-app-service",
);

injector.require("platformController", "./controllers/platform-controller");
injector.require("prepareController", "./controllers/prepare-controller");
injector.require("deployController", "./controllers/deploy-controller");
injector.requirePublicClass(
	"buildController",
	"./controllers/build-controller",
);
injector.requirePublicClass("runController", "./controllers/run-controller");
injector.requirePublicClass(
	"debugController",
	"./controllers/debug-controller",
);
injector.requirePublicClass(
	"updateController",
	"./controllers/update-controller",
);
injector.requirePublicClass(
	"migrateController",
	"./controllers/migrate-controller",
);

injector.require("prepareDataService", "./services/prepare-data-service");
injector.require("buildDataService", "./services/build-data-service");

injector.require(
	"liveSyncServiceResolver",
	"./resolvers/livesync-service-resolver",
);

injector.require(
	"liveSyncProcessDataService",
	"./services/livesync-process-data-service",
);
injector.require("debugDataService", "./services/debug-data-service");
injector.require(
	"iOSDeviceDebugService",
	"./services/ios-device-debug-service",
);
injector.require(
	"androidDeviceDebugService",
	"./services/android-device-debug-service",
);

injector.require(
	"timelineProfilerService",
	"./services/timeline-profiler-service",
);
injector.require("userSettingsService", "./services/user-settings-service");
injector.requirePublic(
	"analyticsSettingsService",
	"./services/analytics-settings-service",
);
injector.require("analyticsService", "./services/analytics/analytics-service");
injector.require(
	"googleAnalyticsProvider",
	"./services/analytics/google-analytics-provider",
);
injector.require("platformCommandParameter", "./platform-command-param");
registerBuiltInCommand<
	typeof import("./commands/create-project").CreateProjectCommand
>("create", () => require("./commands/create-project").CreateProjectCommand);
registerBuiltInCommand<
	typeof import("./commands/clean").cleanCommandDefinition
>("clean", () => require("./commands/clean").cleanCommandDefinition);
registerBuiltInCommand<
	typeof import("./commands/config").configListCommandDefinition
>(
	"config|*list",
	() => require("./commands/config").configListCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/config").configGetCommandDefinition
>("config|get", () => require("./commands/config").configGetCommandDefinition);
registerBuiltInCommand<
	typeof import("./commands/config").configSetCommandDefinition
>("config|set", () => require("./commands/config").configSetCommandDefinition);
registerBuiltInCommand<
	typeof import("./commands/generate").generateCommandDefinition
>("generate", () => require("./commands/generate").generateCommandDefinition);
registerBuiltInCommand<
	typeof import("./commands/list-platforms").listPlatformsCommandDefinition
>(
	"platform|*list",
	() => require("./commands/list-platforms").listPlatformsCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/add-platform").AddPlatformCommand
>("platform|add", () => require("./commands/add-platform").AddPlatformCommand);
registerBuiltInCommand<
	typeof import("./commands/remove-platform").removePlatformCommandDefinition
>(
	"platform|remove",
	() => require("./commands/remove-platform").removePlatformCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/update-platform").UpdatePlatformCommand
>(
	"platform|update",
	() => require("./commands/update-platform").UpdatePlatformCommand,
);
registerBuiltInCommand<typeof import("./commands/run").runCommandDefinition>(
	"run|*all",
	() => require("./commands/run").runCommandDefinition,
);
registerBuiltInCommand<typeof import("./commands/run").iosRunCommand>(
	"run|ios",
	() => require("./commands/run").iosRunCommand,
);
registerBuiltInCommand<typeof import("./commands/run").androidRunCommand>(
	"run|android",
	() => require("./commands/run").androidRunCommand,
);
registerBuiltInCommand<typeof import("./commands/run").visionRunCommand>(
	"run|vision",
	() => require("./commands/run").visionRunCommand,
);
registerBuiltInCommand<typeof import("./commands/run").visionRunCommand>(
	"run|visionos",
	() => require("./commands/run").visionRunCommand,
);
registerBuiltInCommand<typeof import("./commands/open").iosOpenCommand>(
	"open|ios",
	() => require("./commands/open").iosOpenCommand,
);
registerBuiltInCommand<typeof import("./commands/open").androidOpenCommand>(
	"open|android",
	() => require("./commands/open").androidOpenCommand,
);
registerBuiltInCommand<typeof import("./commands/open").visionOpenCommand>(
	"open|visionos",
	() => require("./commands/open").visionOpenCommand,
);
registerBuiltInCommand<typeof import("./commands/open").visionOpenCommand>(
	"open|vision",
	() => require("./commands/open").visionOpenCommand,
);
registerBuiltInCommand<typeof import("./commands/typings").TypingsCommand>(
	"typings",
	() => require("./commands/typings").TypingsCommand,
);

registerBuiltInCommand<typeof import("./commands/preview").PreviewCommand>(
	"preview",
	() => require("./commands/preview").PreviewCommand,
);

registerBuiltInCommand<typeof import("./commands/debug").iosDebugCommand>(
	"debug|ios",
	() => require("./commands/debug").iosDebugCommand,
);
registerBuiltInCommand<typeof import("./commands/debug").androidDebugCommand>(
	"debug|android",
	() => require("./commands/debug").androidDebugCommand,
);
registerBuiltInCommand<typeof import("./commands/debug").visionDebugCommand>(
	"debug|vision",
	() => require("./commands/debug").visionDebugCommand,
);
registerBuiltInCommand<typeof import("./commands/debug").visionDebugCommand>(
	"debug|visionos",
	() => require("./commands/debug").visionDebugCommand,
);
registerBuiltInCommand<typeof fontsCommandDefinition>(
	"fonts",
	() => require("./commands/fonts").fontsCommandDefinition,
);

registerBuiltInCommand<
	typeof import("./commands/prepare").prepareCommandDefinition
>("prepare", () => require("./commands/prepare").prepareCommandDefinition);
registerBuiltInCommand<typeof import("./commands/build").iosBuildCommand>(
	"build|ios",
	() => require("./commands/build").iosBuildCommand,
);
registerBuiltInCommand<typeof import("./commands/build").androidBuildCommand>(
	"build|android",
	() => require("./commands/build").androidBuildCommand,
);
registerBuiltInCommand<typeof import("./commands/build").visionBuildCommand>(
	"build|vision",
	() => require("./commands/build").visionBuildCommand,
);
registerBuiltInCommand<typeof import("./commands/build").visionBuildCommand>(
	"build|visionos",
	() => require("./commands/build").visionBuildCommand,
);
registerBuiltInCommand<
	typeof import("./commands/deploy").deployCommandDefinition
>("deploy", () => require("./commands/deploy").deployCommandDefinition);

registerBuiltInCommand<
	typeof import("./commands/embedding/embed").EmbedCommand
>("embed", () => require("./commands/embedding/embed").EmbedCommand);

injector.require("testExecutionService", "./services/test-execution-service");
injector.require(
	"vitestExecutionService",
	"./services/vitest-execution-service",
);
registerBuiltInCommand<
	typeof import("./commands/test").testAndroidCommandDefinition
>(
	"test|android",
	() => require("./commands/test").testAndroidCommandDefinition,
);
registerBuiltInCommand<typeof import("./commands/test").testCommandDefinition>(
	"test|ios",
	() => require("./commands/test").testCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/test").testVisionOSCommandDefinition
>(
	"test|vision",
	() => require("./commands/test").testVisionOSCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/test").testVisionOSCommandDefinition
>(
	"test|visionos",
	() => require("./commands/test").testVisionOSCommandDefinition,
);
registerBuiltInCommand<typeof import("./commands/test-init").TestInitCommand>(
	"test|init",
	() => require("./commands/test-init").TestInitCommand,
);
registerBuiltInCommand<
	typeof import("./commands/generate-help").generateHelpCommandDefinition
>(
	"dev-generate-help",
	() => require("./commands/generate-help").generateHelpCommandDefinition,
);

registerBuiltInCommand<
	typeof import("./commands/appstore-list").ListiOSAppsCommand
>(
	"appstore|*list",
	() => require("./commands/appstore-list").ListiOSAppsCommand,
);
registerBuiltInCommand<
	typeof import("./commands/appstore-upload").PublishIOSCommand
>(
	"appstore|upload",
	() => require("./commands/appstore-upload").PublishIOSCommand,
);
registerBuiltInCommand<
	typeof import("./commands/appstore-upload").PublishIOSCommand
>("publish|ios", () => require("./commands/appstore-upload").PublishIOSCommand);
registerBuiltInCommand<
	typeof import("./commands/apple-login").appleLoginCommandDefinition
>(
	"apple-login",
	() => require("./commands/apple-login").appleLoginCommandDefinition,
);
injector.require(
	"itmsTransporterService",
	"./services/itmstransporter-service",
);

registerBuiltInCommand<
	typeof import("./commands/setup").setupCommandDefinition
>("setup|*", () => require("./commands/setup").setupCommandDefinition);

injector.requirePublic("packageManager", "./package-manager");
injector.requirePublic("npm", "./node-package-manager");
injector.requirePublic("yarn", "./yarn-package-manager");
injector.requirePublic("yarn2", "./yarn2-package-manager");
injector.requirePublic("pnpm", "./pnpm-package-manager");
injector.requirePublic("bun", "./bun-package-manager");
registerBuiltInCommand<
	typeof import("./common/commands/package-manager-get").packageManagerGetCommandDefinition
>(
	"package-manager|*get",
	() =>
		require("./common/commands/package-manager-get")
			.packageManagerGetCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./common/commands/package-manager-set").packageManagerSetCommandDefinition
>(
	"package-manager|set",
	() =>
		require("./common/commands/package-manager-set")
			.packageManagerSetCommandDefinition,
);

injector.require(
	"packageInstallationManager",
	"./package-installation-manager",
);

injector.require("deviceLogProvider", "./common/mobile/device-log-provider");
injector.require("projectFilesProvider", "./providers/project-files-provider");

injector.require(
	"nodeModulesBuilder",
	"./tools/node-modules/node-modules-builder",
);

injector.require(
	"pluginVariablesService",
	"./services/plugin-variables-service",
);
injector.require("pluginsService", "./services/plugins-service");
registerBuiltInCommand<
	typeof import("./commands/plugin/list-plugins").listPluginsCommandDefinition
>(
	"plugin|*list",
	() => require("./commands/plugin/list-plugins").listPluginsCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/add-plugin").addPluginCommandDefinition
>(
	"plugin|add",
	() => require("./commands/plugin/add-plugin").addPluginCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/add-plugin").addPluginCommandDefinition
>(
	"plugin|install",
	() => require("./commands/plugin/add-plugin").addPluginCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/remove-plugin").removePluginCommandDefinition
>(
	"plugin|remove",
	() =>
		require("./commands/plugin/remove-plugin").removePluginCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/update-plugin").updatePluginCommandDefinition
>(
	"plugin|update",
	() =>
		require("./commands/plugin/update-plugin").updatePluginCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/build-plugin").BuildPluginCommand
>(
	"plugin|build",
	() => require("./commands/plugin/build-plugin").BuildPluginCommand,
);
registerBuiltInCommand<
	typeof import("./commands/plugin/create-plugin").CreatePluginCommand
>(
	"plugin|create",
	() => require("./commands/plugin/create-plugin").CreatePluginCommand,
);

registerBuiltInCommand<
	typeof import("./commands/hooks/hooks").hooksListCommandDefinition
>(
	"hooks|*list",
	() => require("./commands/hooks/hooks").hooksListCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/hooks/hooks").hooksInstallCommandDefinition
>(
	"hooks|install",
	() => require("./commands/hooks/hooks").hooksInstallCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/hooks/hooks-lock").hooksLockCommandDefinition
>(
	"hooks|lock",
	() => require("./commands/hooks/hooks-lock").hooksLockCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/hooks/hooks-lock").hooksVerifyCommandDefinition
>(
	"hooks|verify",
	() => require("./commands/hooks/hooks-lock").hooksVerifyCommandDefinition,
);

injector.require("doctorService", "./services/doctor-service");
injector.require("xcprojService", "./services/xcproj-service");
injector.require("versionsService", "./services/versions-service");
registerBuiltInCommand<
	typeof import("./commands/install").installCommandDefinition
>("install", () => require("./commands/install").installCommandDefinition);

injector.require("infoService", "./services/info-service");
registerBuiltInCommand<typeof import("./commands/info").infoCommandDefinition>(
	"info",
	() => require("./commands/info").infoCommandDefinition,
);

injector.require(
	"androidResourcesMigrationService",
	"./services/android-resources-migration-service",
);
registerBuiltInCommand<
	typeof import("./commands/resources/resources-update").resourcesUpdateCommandDefinition
>(
	"resources|update",
	() =>
		require("./commands/resources/resources-update")
			.resourcesUpdateCommandDefinition,
);

injector.require("androidToolsInfo", "./android-tools-info");
injector.require("devicePathProvider", "./device-path-provider");

registerBuiltInCommand<
	typeof import("./commands/platform-clean").PlatformCleanCommand
>(
	"platform|clean",
	() => require("./commands/platform-clean").PlatformCleanCommand,
);

injector.require(
	"androidBundleValidatorHelper",
	"./helpers/android-bundle-validator-helper",
);
injector.require("liveSyncCommandHelper", "./helpers/livesync-command-helper");

injector.require("deployCommandHelper", "./helpers/deploy-command-helper");
injector.require("platformCommandHelper", "./helpers/platform-command-helper");
injector.require("optionsTracker", "./helpers/options-track-helper");

injector.require("LiveSyncSocket", "./services/livesync/livesync-socket");
injector.requirePublicClass(
	"androidLivesyncTool",
	"./services/livesync/android-livesync-tool",
);
injector.require(
	"androidLiveSyncService",
	"./services/livesync/android-livesync-service",
);
injector.require(
	"iOSLiveSyncService",
	"./services/livesync/ios-livesync-service",
);
injector.require("usbLiveSyncService", "./services/livesync/livesync-service"); // The name is used in https://github.com/NativeScript/nativescript-dev-typescript
injector.requirePublic("sysInfo", "./sys-info");

injector.require(
	"iOSNotificationService",
	"./services/ios-notification-service",
);
injector.require(
	"appDebugSocketProxyFactory",
	"./device-sockets/ios/app-debug-socket-proxy-factory",
);
injector.require("iOSNotification", "./device-sockets/ios/notification");
injector.require(
	"iOSSocketRequestExecutor",
	"./device-sockets/ios/socket-request-executor",
);
injector.require("messages", "./common/messages/messages");

registerBuiltInCommand<
	typeof import("./commands/post-install").PostInstallCliCommand
>(
	"post-install-cli",
	() => require("./commands/post-install").PostInstallCliCommand,
);
registerBuiltInCommand<
	typeof import("./commands/migrate").migrateCommandDefinition
>("migrate", () => require("./commands/migrate").migrateCommandDefinition);
registerBuiltInCommand<typeof import("./commands/update").UpdateCommand>(
	"update",
	() => require("./commands/update").UpdateCommand,
);

injector.require("iOSLogFilter", "./services/ios-log-filter");
injector.require("logSourceMapService", "./services/log-source-map-service");
injector.require("projectChangesService", "./services/project-changes-service");

injector.require("pbxprojDomXcode", "./node/pbxproj-dom-xcode");
injector.require("xcode", "./node/xcode");

injector.require("staticConfig", "./config");

injector.require("requireService", "./services/require-service");

registerBuiltInCommand<
	typeof import("./commands/extensibility/list-extensions").listExtensionsCommandDefinition
>(
	"extension|*list",
	() =>
		require("./commands/extensibility/list-extensions")
			.listExtensionsCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/extensibility/install-extension").installExtensionCommandDefinition
>(
	"extension|install",
	() =>
		require("./commands/extensibility/install-extension")
			.installExtensionCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/extensibility/uninstall-extension").uninstallExtensionCommandDefinition
>(
	"extension|uninstall",
	() =>
		require("./commands/extensibility/uninstall-extension")
			.uninstallExtensionCommandDefinition,
);
injector.requirePublicClass(
	"extensibilityService",
	"./services/extensibility-service",
);

injector.require(
	"nodeModulesDependenciesBuilder",
	"./tools/node-modules/node-modules-dependencies-builder",
);
injector.require(
	"terminalSpinnerService",
	"./services/terminal-spinner-service",
);

injector.require(
	"platformEnvironmentRequirements",
	"./services/platform-environment-requirements",
);

registerBuiltInCommand<
	typeof import("./commands/generate-assets").generateIconsCommand
>(
	"resources|generate|icons",
	() => require("./commands/generate-assets").generateIconsCommand,
);
registerBuiltInCommand<
	typeof import("./commands/generate-assets").generateSplashesCommand
>(
	"resources|generate|splashes",
	() => require("./commands/generate-assets").generateSplashesCommand,
);
injector.requirePublic(
	"assetsGenerationService",
	"./services/assets-generation/assets-generation-service",
);

injector.require("filesHashService", "./services/files-hash-service");
injector.require("logParserService", "./services/log-parser-service");
injector.require(
	"iOSDebuggerPortService",
	"./services/ios-debugger-port-service",
);
injector.require("hmrStatusService", "./services/hmr-status-service");

injector.require("pacoteService", "./services/pacote-service");
injector.require(
	"testInitializationService",
	"./services/test-initialization-service",
);

injector.requirePublic("cleanupService", "./services/cleanup-service");

injector.require(
	"bundlerCompilerService",
	"./services/bundler/bundler-compiler-service",
);
injector.require(
	"viteHmrPortService",
	"./services/bundler/vite-hmr-port-service",
);

injector.require(
	"applePortalSessionService",
	"./services/apple-portal/apple-portal-session-service",
);
injector.require(
	"applePortalCookieService",
	"./services/apple-portal/apple-portal-cookie-service",
);
injector.require(
	"applePortalApplicationService",
	"./services/apple-portal/apple-portal-application-service",
);

injector.require(
	"watchIgnoreListService",
	"./services/watch-ignore-list-service",
);

injector.requirePublicClass(
	"initializeService",
	"./services/initialize-service",
);

injector.require("npmConfigService", "./services/npm-config-service");
injector.require("ipService", "./services/ip-service");
injector.require(
	"jsonFileSettingsService",
	"./common/services/json-file-settings-service",
);
injector.require("markingModeService", "./services/marking-mode-service");
injector.require(
	"metadataFilteringService",
	"./services/metadata-filtering-service",
);
injector.require("tempService", "./services/temp-service");

injector.require("sharedEventBus", "./shared-event-bus");

injector.require("keyShortcutRegistry", "./services/key-shortcut-registry");
injector.require("keyShortcutService", "./services/key-shortcuts");

registerBuiltInCommand<
	typeof import("./commands/start").startCommandDefinition
>("start", () => require("./commands/start").startCommandDefinition);
injector.require("startService", "./services/start-service");
registerBuiltInCommand<
	typeof import("./commands/native-add").nativeAddCommandDefinition
>(
	"native|add",
	() => require("./commands/native-add").nativeAddCommandDefinition,
);
registerBuiltInCommand<
	typeof import("./commands/native-add").javaNativeAddCommand
>(
	"native|add|java",
	() => require("./commands/native-add").javaNativeAddCommand,
);
registerBuiltInCommand<
	typeof import("./commands/native-add").kotlinNativeAddCommand
>(
	"native|add|kotlin",
	() => require("./commands/native-add").kotlinNativeAddCommand,
);
registerBuiltInCommand<
	typeof import("./commands/native-add").swiftNativeAddCommand
>(
	"native|add|swift",
	() => require("./commands/native-add").swiftNativeAddCommand,
);
registerBuiltInCommand<
	typeof import("./commands/native-add").objectiveCNativeAddCommand
>(
	"native|add|objective-c",
	() => require("./commands/native-add").objectiveCNativeAddCommand,
);
registerBuiltInCommand<
	typeof import("./commands/widget").widgetIOSCommandDefinition
>("widget|ios", () => require("./commands/widget").widgetIOSCommandDefinition);
