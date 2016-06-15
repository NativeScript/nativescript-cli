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
		private $androidDebugService:IDebugService,
		private $iOSDebugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $childProcess: IChildProcess) {
	}

	public platform: string;

	public startTestRunner(platform: string) : IFuture<void> {
		return (() => {
			this.platform = platform;
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
						let configJs = this.generateConfig(this.$options.port.toString(), configOptions);
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
		let karmaFuture = new Future<void>();

		platform = platform.toLowerCase();
		this.platform = platform;

		if(this.$options.debugBrk && this.$options.watch) {
			this.$errors.failWithoutHelp("You cannot use --watch and --debug-brk simultaneously. Remove one of the flags and try again.");
		}

		if (!this.$platformService.preparePlatform(platform).wait()) {
			this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
		}

		let projectDir = this.$projectData.projectDir;
		this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device }).wait();

		let karmaConfig = this.getKarmaConfiguration(platform),
			karmaRunner = this.$childProcess.fork(path.join(__dirname, "karma-execution.js"));

		karmaRunner.send({karmaConfig: karmaConfig});
		karmaRunner.on("message", (karmaData: any) => {
			fiberBootstrap.run(() => {
				this.$logger.trace("## Unit-testing: Parent process received message", karmaData);
				let port: string;
				if(karmaData.url) {
					port = karmaData.url.port;
					let socketIoJsUrl = `http://${karmaData.url.host}/socket.io/socket.io.js`;
					let socketIoJs = this.$httpClient.httpRequest(socketIoJsUrl).wait().body;
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs).wait();
				}

				if(karmaData.launcherConfig) {
					let configOptions: IKarmaConfigOptions = JSON.parse(karmaData.launcherConfig);
					let configJs = this.generateConfig(port, configOptions);
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs).wait();
				}

				if(this.$options.debugBrk) {
					this.getDebugService(platform).debug().wait();
				} else {
					this.liveSyncProject(platform).wait();
				}
			});
		});
		karmaRunner.on("exit", (exitCode: number) => {
			if (exitCode !== 0) {
				//End our process with a non-zero exit code
				const testError = <any>new Error("Test run failed.");
				testError.suppressCommandHelp = true;
				karmaFuture.throw(testError);
			} else {
				karmaFuture.return();
			}
		});
		return karmaFuture;
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

	private generateConfig(port: string, options: any): string {
		let nics = os.networkInterfaces();
		let ips = Object.keys(nics)
			.map(nicName => nics[nicName].filter((binding: any) => binding.family === 'IPv4')[0])
			.filter(binding => binding)
			.map(binding => binding.address);

		let config = {
			port,
			ips,
			options,
		};

		return 'module.exports = ' + JSON.stringify(config);
	}

	private getDebugService(platform: string): IDebugService {
		let lowerCasedPlatform = platform.toLowerCase();
		if(lowerCasedPlatform === this.$devicePlatformsConstants.iOS.toLowerCase()) {
			return this.$iOSDebugService;
		} else if(lowerCasedPlatform === this.$devicePlatformsConstants.Android.toLowerCase()) {
			return this.$androidDebugService;
		}

		throw new Error(`Invalid platform ${platform}. Valid platforms are ${this.$devicePlatformsConstants.iOS} and ${this.$devicePlatformsConstants.Android}`);
	}

	private getKarmaConfiguration(platform: string): any {
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
					watch: !!this.$options.watch
				}
			},
		};

		if (this.$config.DEBUG || this.$logger.getLevel() === 'TRACE') {
			karmaConfig.logLevel = 'DEBUG';
		}

		if (!this.$options.watch) {
			// Setting singleRun to true will automatically start the tests when new browser (device in our case) is registered in karma.
			karmaConfig.singleRun = true;
		}

		if (this.$options.debugBrk) {
			karmaConfig.browserNoActivityTimeout = 1000000000;
		}

		karmaConfig.projectDir = this.$projectData.projectDir;
		this.$logger.debug(JSON.stringify(karmaConfig, null, 4));

		return karmaConfig;
	}

	private liveSyncProject(platform: string): IFuture<void> {
		return (() => {
			let platformData = this.$platformsData.getPlatformData(platform.toLowerCase()),
				projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

			let liveSyncData: ILiveSyncData = {
				platform: platform,
				appIdentifier: this.$projectData.projectId,
				projectFilesPath: projectFilesPath,
				syncWorkingDirectory: path.join(this.$projectData.projectDir, constants.APP_FOLDER_NAME),
				canExecuteFastSync: false, // Always restart the application when change is detected, so tests will be rerun.
				excludedProjectDirsAndFiles: this.$options.release ? constants.LIVESYNC_EXCLUDED_FILE_PATTERNS : []
			};

			this.$liveSyncServiceBase.sync(liveSyncData).wait();
		}).future<void>()();
	}
}
$injector.register('testExecutionService', TestExecutionService);
