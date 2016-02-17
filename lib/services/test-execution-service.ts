///<reference path="../.d.ts"/>

"use strict";

import * as constants from "../constants";
import * as path from 'path';
import Future = require('fibers/future');
import * as os from 'os';
import * as fiberBootstrap from "../common/fiber-bootstrap";

interface IKarmaConfigOptions {
	debugBrk: boolean;
	debugTransport: boolean;
}

class TestExecutionService implements ITestExecutionService {
	private static MAIN_APP_NAME = `./tns_modules/${constants.TEST_RUNNER_NAME}/app.js`;
	private static CONFIG_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/config.js`;
	private static SOCKETIO_JS_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/socket.io.js`;

	constructor(private $injector: IInjector,
		private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $liveSyncServiceBase: ILiveSyncServiceBase,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $resources: IResourceLoader,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $pluginsService: IPluginsService,
		private $errors: IErrors,
		private $devicesService: Mobile.IDevicesService) {
	}

	public startTestRunner(platform: string) : IFuture<void> {
		return (() => {
			this.$options.justlaunch = true;
			let blockingOperationFuture = new Future<void>();
			process.on('message', (launcherConfig: any) => {
				fiberBootstrap.run(() => {
					try {
						let platformData = this.$platformsData.getPlatformData(platform.toLowerCase());
						let projectDir = this.$projectData.projectDir;
						this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device }).wait();
						let projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

						let configOptions: IKarmaConfigOptions = JSON.parse(launcherConfig);
						this.$options.debugBrk = configOptions.debugBrk;
						this.$options.debugTransport = configOptions.debugTransport;
						let configJs = this.generateConfig(configOptions);
						this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs).wait();

						let socketIoJsUrl = `http://localhost:${this.$options.port}/socket.io/socket.io.js`;
						let socketIoJs = this.$httpClient.httpRequest(socketIoJsUrl).wait().body;
						this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs).wait();

						if (!this.$platformService.preparePlatform(platform).wait()) {
							this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
						}
						this.detourEntryPoint(projectFilesPath).wait();

						let liveSyncData = {
							platform: platform,
							appIdentifier: this.$projectData.projectId,
							projectFilesPath: projectFilesPath,
							syncWorkingDirectory: path.join(projectDir, constants.APP_FOLDER_NAME)
						};

						this.$liveSyncServiceBase.sync(liveSyncData).wait();

						if (this.$options.debugBrk) {
							this.$logger.info('Starting debugger...');
							let debugService: IDebugService = this.$injector.resolve(`${platform}DebugService`);
							debugService.debugStart().wait();
						}
						blockingOperationFuture.return();
					} catch(err) {
						// send the error to the real future
						blockingOperationFuture.throw(err);
					}
				});
			});

			// Tell the parent that we are ready to receive the data.
			process.send("ready");
			blockingOperationFuture.wait();
		}).future<void>()();
	}

	public startKarmaServer(platform: string): IFuture<void> {
		return (() => {
			platform = platform.toLowerCase();
			this.$pluginsService.ensureAllDependenciesAreInstalled().wait();
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
