import * as constants from "../constants";
import * as path from 'path';
import * as os from 'os';

interface IKarmaConfigOptions {
	debugBrk: boolean;
	debugTransport: boolean;
}

class TestExecutionService implements ITestExecutionService {
	private static MAIN_APP_NAME = `./tns_modules/${constants.TEST_RUNNER_NAME}/app.js`;
	private static CONFIG_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/config.js`;
	private static SOCKETIO_JS_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/socket.io.js`;

	constructor(private $injector: IInjector,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $liveSyncService: ILiveSyncService,
		private $debugDataService: IDebugDataService,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $pluginsService: IPluginsService,
		private $errors: IErrors,
		private $debugService: IDebugService,
		private $devicesService: Mobile.IDevicesService,
		private $childProcess: IChildProcess) {
	}

	public platform: string;

	public async startTestRunner(platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		this.platform = platform;
		this.$options.justlaunch = true;
		await new Promise<void>((resolve, reject) => {
			process.on('message', async (launcherConfig: any) => {
				try {
					const platformData = this.$platformsData.getPlatformData(platform.toLowerCase(), projectData);
					const projectDir = projectData.projectDir;
					await this.$devicesService.initialize({
						platform: platform,
						deviceId: this.$options.device,
						emulator: this.$options.emulator
					});
					const projectFilesPath = path.join(platformData.appDestinationDirectoryPath, constants.APP_FOLDER_NAME);

					const configOptions: IKarmaConfigOptions = JSON.parse(launcherConfig);
					this.$options.debugBrk = configOptions.debugBrk;
					this.$options.debugTransport = configOptions.debugTransport;
					const configJs = this.generateConfig(this.$options.port.toString(), configOptions);
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs);

					const socketIoJsUrl = `http://localhost:${this.$options.port}/socket.io/socket.io.js`;
					const socketIoJs = (await this.$httpClient.httpRequest(socketIoJsUrl)).body;
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs);
					const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
						bundle: !!this.$options.bundle,
						release: this.$options.release,
						useHotModuleReload: this.$options.hmr
					};
					const preparePlatformInfo: IPreparePlatformInfo = {
						platform,
						appFilesUpdaterOptions,
						platformTemplate: this.$options.platformTemplate,
						projectData,
						config: this.$options,
						env: this.$options.env
					};

					if (!await this.$platformService.preparePlatform(preparePlatformInfo)) {
						this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
					}

					this.detourEntryPoint(projectFilesPath);

					const deployOptions: IDeployPlatformOptions = {
						clean: this.$options.clean,
						device: this.$options.device,
						emulator: this.$options.emulator,
						projectDir: this.$options.path,
						platformTemplate: this.$options.platformTemplate,
						release: this.$options.release,
						provision: this.$options.provision,
						teamId: this.$options.teamId
					};

					if (this.$options.bundle) {
						this.$options.watch = false;
					}

					const devices = this.$devicesService.getDeviceInstances();
					// Now let's take data for each device:
					const platformLowerCase = this.platform && this.platform.toLowerCase();
					const deviceDescriptors: ILiveSyncDeviceInfo[] = devices.filter(d => !platformLowerCase || d.deviceInfo.platform.toLowerCase() === platformLowerCase)
						.map(d => {
							const info: ILiveSyncDeviceInfo = {
								identifier: d.deviceInfo.identifier,
								buildAction: async (): Promise<string> => {
									const buildConfig: IBuildConfig = {
										buildForDevice: !d.isEmulator, // this.$options.forDevice,
										projectDir: this.$options.path,
										clean: this.$options.clean,
										teamId: this.$options.teamId,
										device: this.$options.device,
										provision: this.$options.provision,
										release: this.$options.release,
										keyStoreAlias: this.$options.keyStoreAlias,
										keyStorePath: this.$options.keyStorePath,
										keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
										keyStorePassword: this.$options.keyStorePassword
									};

									await this.$platformService.buildPlatform(d.deviceInfo.platform, buildConfig, projectData);
									const pathToBuildResult = await this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, projectData);
									return pathToBuildResult;
								},
								debugOptions: this.$options
							};

							return info;
						});

					const liveSyncInfo: ILiveSyncInfo = {
						projectDir: projectData.projectDir,
						skipWatcher: !this.$options.watch || this.$options.justlaunch,
						watchAllFiles: this.$options.syncAllFiles,
						bundle: !!this.$options.bundle,
						release: this.$options.release,
						env: this.$options.env,
						timeout: this.$options.timeout,
						useHotModuleReload: this.$options.hmr
					};

					await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);

					if (this.$options.debugBrk) {
						this.$logger.info('Starting debugger...');
						const debugService: IDeviceDebugService = this.$injector.resolve(`${platform}DebugService`);
						const debugData = this.getDebugData(platform, projectData, deployOptions);
						await debugService.debugStart(debugData, this.$options);
					}
					resolve();
				} catch (err) {
					reject(err);
				}
			});

			// Tell the parent that we are ready to receive the data.
			process.send("ready");
		});
	}

	public async startKarmaServer(platform: string, projectData: IProjectData, projectFilesConfig: IProjectFilesConfig): Promise<void> {
		platform = platform.toLowerCase();
		this.platform = platform;

		if (this.$options.debugBrk && this.$options.watch) {
			this.$errors.failWithoutHelp("You cannot use --watch and --debug-brk simultaneously. Remove one of the flags and try again.");
		}

		// We need the dependencies installed here, so we can start the Karma server.
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);

		const projectDir = projectData.projectDir;
		await this.$devicesService.initialize({
			platform: platform,
			deviceId: this.$options.device,
			emulator: this.$options.emulator
		});

		const karmaConfig = this.getKarmaConfiguration(platform, projectData),
			// In case you want to debug the unit test runner, add "--inspect-brk=<port>" as a first element in the array of args.
			karmaRunner = this.$childProcess.spawn(process.execPath, [path.join(__dirname, "karma-execution.js")], { stdio: ["inherit", "inherit", "inherit", "ipc"] }),
			launchKarmaTests = async (karmaData: any) => {
				this.$logger.trace("## Unit-testing: Parent process received message", karmaData);
				let port: string;
				if (karmaData.url) {
					port = karmaData.url.port;
					const socketIoJsUrl = `http://${karmaData.url.host}/socket.io/socket.io.js`;
					const socketIoJs = (await this.$httpClient.httpRequest(socketIoJsUrl)).body;
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.SOCKETIO_JS_FILE_NAME), socketIoJs);
				}

				if (karmaData.launcherConfig) {
					const configOptions: IKarmaConfigOptions = JSON.parse(karmaData.launcherConfig);
					const configJs = this.generateConfig(port, configOptions);
					this.$fs.writeFile(path.join(projectDir, TestExecutionService.CONFIG_FILE_NAME), configJs);
				}

				const appFilesUpdaterOptions: IAppFilesUpdaterOptions = {
					bundle: !!this.$options.bundle,
					release: this.$options.release,
					useHotModuleReload: this.$options.hmr
				};
				const preparePlatformInfo: IPreparePlatformInfo = {
					platform,
					appFilesUpdaterOptions,
					platformTemplate: this.$options.platformTemplate,
					projectData,
					config: this.$options,
					env: this.$options.env
				};

				// Prepare the project AFTER the TestExecutionService.CONFIG_FILE_NAME file is created in node_modules
				// so it will be sent to device.
				if (!await this.$platformService.preparePlatform(preparePlatformInfo)) {
					this.$errors.failWithoutHelp("Verify that listed files are well-formed and try again the operation.");
				}

				const deployOptions: IDeployPlatformOptions = {
					clean: this.$options.clean,
					device: this.$options.device,
					emulator: this.$options.emulator,
					projectDir: this.$options.path,
					platformTemplate: this.$options.platformTemplate,
					release: this.$options.release,
					provision: this.$options.provision,
					teamId: this.$options.teamId
				};

				if (this.$options.debugBrk) {
					const debugData = this.getDebugData(platform, projectData, deployOptions);
					await this.$debugService.debug(debugData, this.$options);
				} else {
					const devices = this.$devicesService.getDeviceInstances();
					// Now let's take data for each device:
					const platformLowerCase = this.platform && this.platform.toLowerCase();
					const deviceDescriptors: ILiveSyncDeviceInfo[] = devices.filter(d => !platformLowerCase || d.deviceInfo.platform.toLowerCase() === platformLowerCase)
						.map(d => {
							const info: ILiveSyncDeviceInfo = {
								identifier: d.deviceInfo.identifier,
								buildAction: async (): Promise<string> => {
									const buildConfig: IBuildConfig = {
										buildForDevice: !d.isEmulator,
										projectDir: this.$options.path,
										clean: this.$options.clean,
										teamId: this.$options.teamId,
										device: this.$options.device,
										provision: this.$options.provision,
										release: this.$options.release,
										keyStoreAlias: this.$options.keyStoreAlias,
										keyStorePath: this.$options.keyStorePath,
										keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
										keyStorePassword: this.$options.keyStorePassword
									};

									await this.$platformService.buildPlatform(d.deviceInfo.platform, buildConfig, projectData);
									const pathToBuildResult = await this.$platformService.lastOutputPath(d.deviceInfo.platform, buildConfig, projectData);
									return pathToBuildResult;
								},
								debugOptions: this.$options
							};

							return info;
						});

					const liveSyncInfo: ILiveSyncInfo = {
						projectDir: projectData.projectDir,
						skipWatcher: !this.$options.watch || this.$options.justlaunch,
						watchAllFiles: this.$options.syncAllFiles,
						bundle: !!this.$options.bundle,
						release: this.$options.release,
						env: this.$options.env,
						timeout: this.$options.timeout,
						useHotModuleReload: this.$options.hmr
					};

					await this.$liveSyncService.liveSync(deviceDescriptors, liveSyncInfo);
				}
			};

		karmaRunner.on("message", (karmaData: any) => {
			launchKarmaTests(karmaData)
				.catch((result) => {
					this.$logger.error(result);
					process.exit(ErrorCodes.KARMA_FAIL);
				});
		});

		return new Promise<void>((resolve, reject) => {
			karmaRunner.on("exit", (exitCode: number) => {
				if (exitCode !== 0) {
					//End our process with a non-zero exit code
					const testError = <any>new Error("Test run failed.");
					testError.suppressCommandHelp = true;
					reject(testError);
				} else {
					resolve();
				}
			});

			karmaRunner.send({ karmaConfig: karmaConfig });
		});
	}

	allowedParameters: ICommandParameter[] = [];

	private detourEntryPoint(projectFilesPath: string): void {
		const packageJsonPath = path.join(projectFilesPath, 'package.json');
		const packageJson = this.$fs.readJson(packageJsonPath);
		packageJson.main = TestExecutionService.MAIN_APP_NAME;
		this.$fs.writeJson(packageJsonPath, packageJson);
	}

	private generateConfig(port: string, options: any): string {
		const nics = os.networkInterfaces();
		const ips = Object.keys(nics)
			.map(nicName => nics[nicName].filter((binding: any) => binding.family === 'IPv4')[0])
			.filter(binding => binding)
			.map(binding => binding.address);

		const config = {
			port,
			ips,
			options,
		};

		return 'module.exports = ' + JSON.stringify(config);
	}

	private getKarmaConfiguration(platform: string, projectData: IProjectData): any {
		const karmaConfig: any = {
			browsers: [platform],
			configFile: path.join(projectData.projectDir, 'karma.conf.js'),
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

		karmaConfig.projectDir = projectData.projectDir;
		this.$logger.debug(JSON.stringify(karmaConfig, null, 4));

		return karmaConfig;
	}

	private getDebugData(platform: string, projectData: IProjectData, deployOptions: IDeployPlatformOptions): IDebugData {
		const buildConfig: IBuildConfig = _.merge({ buildForDevice: this.$options.forDevice }, deployOptions);
		const debugData = this.$debugDataService.createDebugData(projectData, this.$options);
		debugData.pathToAppPackage = this.$platformService.lastOutputPath(platform, buildConfig, projectData);

		return debugData;
	}
}
$injector.register('testExecutionService', TestExecutionService);
