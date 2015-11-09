///<reference path="../.d.ts"/>

"use strict";

import * as constants from "../constants";
import * as path from 'path';
import Future = require('fibers/future');
import * as os from 'os';

interface IKarmaConfigOptions {
	debugBrk: boolean;
	debugTransport: boolean;
}

class TestExecutionService implements ITestExecutionService {
	private static MAIN_APP_NAME = `./tns_modules/${constants.TEST_RUNNER_NAME}/app.js`;
	private static CONFIG_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/config.js`;
	private static SOCKETIO_JS_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/socket.io.js`;

	constructor(
		private $injector: IInjector,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $usbLiveSyncServiceBase: IUsbLiveSyncServiceBase,
		private $androidUsbLiveSyncServiceLocator: {factory: Function},
		private $iosUsbLiveSyncServiceLocator: {factory: Function},
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $resources: IResourceLoader,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions) {
	}

	public startTestRunner(platform: string) : IFuture<void> {
		return (() => {
			this.$options.justlaunch = true;

			let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
			let projectDir = this.$projectData.projectDir;

			let projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

			let configOptions: IKarmaConfigOptions = JSON.parse(this.$fs.readStdin().wait());
			this.$options.debugBrk = configOptions.debugBrk;
			this.$options.debugTransport = configOptions.debugTransport;
			let configJs = this.generateConfig(configOptions);
			this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs).wait();

			let socketIoJsUrl = `http://localhost:${this.$options.port}/socket.io/socket.io.js`;
			let socketIoJs = this.$httpClient.httpRequest(socketIoJsUrl).wait().body;
			this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs).wait();

			this.$platformService.preparePlatform(platform).wait();
			this.detourEntryPoint(projectFilesPath).wait();

			let watchGlob = path.join(projectDir, constants.APP_FOLDER_NAME);

			let platformSpecificLiveSyncServices: IDictionary<any> = {
				android: (_device: Mobile.IDevice, $injector: IInjector): IPlatformSpecificLiveSyncService => {
					return $injector.resolve(this.$androidUsbLiveSyncServiceLocator.factory, {_device: _device});
				},
				ios: (_device: Mobile.IDevice, $injector: IInjector) => {
					return $injector.resolve(this.$iosUsbLiveSyncServiceLocator.factory, {_device: _device});
				}
			};

			let notInstalledAppOnDeviceAction = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					this.$platformService.installOnDevice(platform).wait();
					this.detourEntryPoint(projectFilesPath).wait();
				}).future<void>()();
			};

			let notRunningiOSSimulatorAction = (): IFuture<void> => {
				return (() => {
					this.$platformService.deployOnEmulator(this.$devicePlatformsConstants.iOS.toLowerCase()).wait();
					this.detourEntryPoint(projectFilesPath).wait();
				}).future<void>()();
			};

			let beforeBatchLiveSyncAction = (filePath: string): IFuture<string> => {
				return (() => {
					this.$platformService.preparePlatform(platform).wait();
					return path.join(projectFilesPath, path.relative(path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME), filePath));
				}).future<string>()();
			};

			let localProjectRootPath = platform.toLowerCase() === "ios" ? platformData.appDestinationDirectoryPath : null;

			let liveSyncData = {
				platform: platform,
				appIdentifier: this.$projectData.projectId,
				projectFilesPath: projectFilesPath,
				excludedProjectDirsAndFiles: constants.LIVESYNC_EXCLUDED_DIRECTORIES,
				watchGlob: watchGlob,
				platformSpecificLiveSyncServices: platformSpecificLiveSyncServices,
				notInstalledAppOnDeviceAction: notInstalledAppOnDeviceAction,
				notRunningiOSSimulatorAction: notRunningiOSSimulatorAction,
				localProjectRootPath: localProjectRootPath,
				beforeBatchLiveSyncAction: beforeBatchLiveSyncAction,
				shouldRestartApplication: (localToDevicePaths: Mobile.ILocalToDevicePathData[]) => Future.fromResult(!this.$options.debugBrk),
				canExecuteFastLiveSync: (filePath: string) => false,
			};

			this.$usbLiveSyncServiceBase.sync(liveSyncData).wait();

			if (this.$options.debugBrk) {
				this.$logger.info('Starting debugger...');
				let debugService: IDebugService = this.$injector.resolve(`${platform}DebugService`);
				debugService.debugStart().wait();
			}
		}).future<void>()();
	}

	public startKarmaServer(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			let pathToKarma = path.join(this.$projectData.projectDir, 'node_modules/karma');
			let KarmaServer = require(path.join(pathToKarma, 'lib/server'));
			if (platform === 'ios' && this.$options.emulator) {
				platform = 'ios_simulator';
			}
			let karmaConfig: any = {
				browsers: [platform],
				configFile: path.join(this.$projectData.projectDir, 'karma.conf.js'),
				_NS: {
					log: this.$logger.getLevel(),
					path: this.$options.path,
					tns: process.argv[1],
					node: process.execPath,
					options: {
						debugTransport: this.$options.debugTransport,
						debugBrk: this.$options.debugBrk,
					}
				},
			};
			if (this.$config.DEBUG || this.$logger.getLevel() === 'TRACE') {
				karmaConfig.logLevel = 'DEBUG';
			}
			if (!this.$options.watch) {
				karmaConfig.singleRun = true;
			}
			if (this.$options.debugBrk) {
				karmaConfig.browserNoActivityTimeout = 1000000000;
			}
			this.$logger.debug(JSON.stringify(karmaConfig, null, 4));
			new KarmaServer(karmaConfig).start();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	private detourEntryPoint(projectFilesPath: string): IFuture<void> {
		return (() => {
			let packageJsonPath = path.join(projectFilesPath, 'package.json');
			let packageJson = this.$fs.readJson(packageJsonPath).wait();
			packageJson.main = TestExecutionService.MAIN_APP_NAME;
			this.$fs.writeJson(packageJsonPath, packageJson).wait();
		}).future<void>()();
	}

	private generateConfig(options: any): string {
		let port = this.$options.port;
		let nics = os.networkInterfaces();
		let ips = Object.keys(nics)
			.map(nicName => nics[nicName].filter((binding: any) => binding.family === 'IPv4' && !binding.internal)[0])
			.filter(binding => binding)
			.map(binding => binding.address);

		let config = {
			port,
			ips,
			options,
		};

		return 'module.exports = ' + JSON.stringify(config);
	}
}
$injector.register('testExecutionService', TestExecutionService);
