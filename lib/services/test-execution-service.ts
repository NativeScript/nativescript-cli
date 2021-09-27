import * as constants from "../constants";
import * as path from "path";
import * as os from "os";
import { RunController } from "../controllers/run-controller";
import {
	ITestExecutionService,
	IProjectDataService,
	IProjectData,
} from "../definitions/project";
import { IConfiguration, IOptions } from "../declarations";
import { IPluginsService } from "../definitions/plugins";
import {
	Server,
	IFileSystem,
	IChildProcess,
	ErrorCodes,
} from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";
import { ICommandParameter } from "../common/definitions/commands";
import { resolvePackagePath } from "../helpers/package-path-helper";

interface IKarmaConfigOptions {
	debugBrk: boolean;
	debugTransport: boolean;
	appPath: string;
}

export class TestExecutionService implements ITestExecutionService {
	private static CONFIG_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/config.js`;
	private static SOCKETIO_JS_FILE_NAME = `node_modules/${constants.TEST_RUNNER_NAME}/socket.io.js`;

	constructor(
		private $runController: RunController,
		private $httpClient: Server.IHttpClient,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $options: IOptions,
		private $pluginsService: IPluginsService,
		private $projectDataService: IProjectDataService,
		private $childProcess: IChildProcess
	) {}

	public platform: string;

	public async startKarmaServer(
		platform: string,
		liveSyncInfo: ILiveSyncInfo,
		deviceDescriptors: ILiveSyncDeviceDescriptor[]
	): Promise<void> {
		platform = platform.toLowerCase();
		this.platform = platform;

		const projectData = this.$projectDataService.getProjectData(
			liveSyncInfo.projectDir
		);

		// We need the dependencies installed here, so we can start the Karma server.
		await this.$pluginsService.ensureAllDependenciesAreInstalled(projectData);

		const karmaConfig = this.getKarmaConfiguration(platform, projectData);
		// In case you want to debug the unit test runner, add "--inspect-brk=<port>" as a first element in the array of args.
		const karmaRunner = this.$childProcess.spawn(
			process.execPath,
			[path.join(__dirname, "karma-execution.js")],
			{ stdio: ["inherit", "inherit", "inherit", "ipc"] }
		);
		const launchKarmaTests = async (karmaData: any) => {
			this.$logger.trace(
				"## Unit-testing: Parent process received message",
				karmaData
			);
			let port: string;
			if (karmaData.url) {
				port = karmaData.url.port;
				const socketIoJsUrl = `http://${karmaData.url.host}/socket.io/socket.io.js`;
				const socketIoJs = (await this.$httpClient.httpRequest(socketIoJsUrl))
					.body;
				this.$fs.writeFile(
					path.join(
						liveSyncInfo.projectDir,
						TestExecutionService.SOCKETIO_JS_FILE_NAME
					),
					JSON.parse(socketIoJs)
				);
			}

			if (karmaData.launcherConfig) {
				const configOptions: IKarmaConfigOptions = JSON.parse(
					karmaData.launcherConfig
				);
				const configJs = this.generateConfig(port, configOptions);
				this.$fs.writeFile(
					path.join(
						liveSyncInfo.projectDir,
						TestExecutionService.CONFIG_FILE_NAME
					),
					configJs
				);
			}

			// Prepare the project AFTER the TestExecutionService.CONFIG_FILE_NAME file is created in node_modules
			// so it will be sent to device.

			await this.$runController.run({
				liveSyncInfo,
				deviceDescriptors,
			});
		};

		karmaRunner.on("message", (karmaData: any) => {
			this.$logger.trace(`The received message from karma is: `, karmaData);
			if (!karmaData.launcherConfig && !karmaData.url) {
				return;
			}

			launchKarmaTests(karmaData).catch((result) => {
				this.$logger.error(result);
				process.exit(ErrorCodes.KARMA_FAIL);
			});
		});

		return new Promise<void>((resolve, reject) => {
			karmaRunner.on("exit", (exitCode: number) => {
				if (exitCode !== 0) {
					//End our process with a non-zero exit code
					const testError = <any>new Error("Test run failed.");
					reject(testError);
				} else {
					resolve();
				}
			});

			karmaRunner.send({ karmaConfig: karmaConfig });
		});
	}

	public async canStartKarmaServer(
		projectData: IProjectData
	): Promise<boolean> {
		let canStartKarmaServer = true;
		const requiredDependencies = ["@nativescript/unit-test-runner"]; // we need @nativescript/unit-test-runner at the local level because of hooks!
		_.each(requiredDependencies, (dep) => {
			if (!projectData.dependencies[dep] && !projectData.devDependencies[dep]) {
				canStartKarmaServer = false;
				return;
			}
		});

		const pathToKarma = resolvePackagePath("karma", {
			paths: [projectData.projectDir],
		});

		canStartKarmaServer = !!pathToKarma;

		return canStartKarmaServer;
	}

	allowedParameters: ICommandParameter[] = [];

	private generateConfig(port: string, options: any): string {
		const nics = os.networkInterfaces();
		const ips = Object.keys(nics)
			.map(
				(nicName) =>
					nics[nicName].filter((binding: any) => binding.family === "IPv4")[0]
			)
			.filter((binding) => binding)
			.map((binding) => binding.address);

		const config = {
			port,
			ips,
			options,
		};

		return "module.exports = " + JSON.stringify(config);
	}

	private getKarmaConfiguration(
		platform: string,
		projectData: IProjectData
	): any {
		const karmaConfig: any = {
			browsers: [platform],
			configFile: path.join(projectData.projectDir, "karma.conf.js"),
			_NS: {
				log: this.$logger.getLevel(),
				path: this.$options.path,
				tns: process.argv[1],
				node: process.execPath,
				options: {
					debugTransport: this.$options.debugTransport,
					debugBrk: this.$options.debugBrk,
					watch: !!this.$options.watch,
					bundle: true,
					appDirectoryRelativePath: projectData.getAppDirectoryRelativePath(),
				},
			},
		};

		if (this.$config.DEBUG || this.$logger.getLevel() === "TRACE") {
			karmaConfig.logLevel = "DEBUG";
		}

		if (!this.$options.watch) {
			// Setting singleRun to true will automatically start the tests when new browser (device in our case) is registered in karma.
			karmaConfig.singleRun = true;
		}

		if (this.$options.debugBrk) {
			karmaConfig.browserNoActivityTimeout = 1000000000;
		}

		karmaConfig.projectDir = projectData.projectDir;
		karmaConfig.bundle = true;
		karmaConfig.debugBrk = this.$options.debugBrk;
		karmaConfig.appPath = projectData.getAppDirectoryRelativePath();
		karmaConfig.platform = platform.toLowerCase();
		this.$logger.debug(JSON.stringify(karmaConfig, null, 4));

		return karmaConfig;
	}
}
injector.register("testExecutionService", TestExecutionService);
