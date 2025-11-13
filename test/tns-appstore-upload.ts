import { PublishIOS } from "../lib/commands/appstore-upload";
import {
	PrompterStub,
	LoggerStub,
	ProjectDataStub,
	ProjectDataServiceStub,
} from "./stubs";
import * as chai from "chai";
import * as yok from "../lib/common/yok";
import { PrepareNativePlatformService } from "../lib/services/platform/prepare-native-platform-service";
import { BuildController } from "../lib/controllers/build-controller";
import { IOSBuildData } from "../lib/data/build-data";
import { IITMSData } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";
import { ICommand } from "../lib/common/definitions/commands";

class AppStore {
	static itunesconnect = {
		user: "person@private.com",
		pass: "god",
	};

	// Services
	injector: IInjector;
	command: ICommand;
	options: any;
	prompter: PrompterStub;
	projectData: ProjectDataStub;
	buildController: BuildController;
	prepareNativePlatformService: PrepareNativePlatformService;
	platformCommandHelper: any;
	platformValidationService: any;
	iOSPlatformData: any;
	iOSProjectService: any;
	loggerService: LoggerStub;
	itmsTransporterService: any;

	// Counters
	preparePlatformCalls: number = 0;
	archiveCalls: number = 0;
	expectedArchiveCalls: number = 0;
	exportArchiveCalls: number = 0;
	itmsTransporterServiceUploadCalls: number = 0;
	expectedItmsTransporterServiceUploadCalls: number = 0;

	before() {
		this.iOSPlatformData = {
			projectRoot: "/Users/person/git/MyProject",
		};
		this.initInjector({
			commands: {
				appstore: PublishIOS,
			},
			services: {
				errors: {},
				fs: {},
				hostInfo: {},
				itmsTransporterService: (this.itmsTransporterService = {}),
				logger: (this.loggerService = new LoggerStub()),
				options: (this.options = {}),
				prompter: (this.prompter = new PrompterStub()),
				projectData: (this.projectData = new ProjectDataStub()),
				stringParameterBuilder: {},
				devicePlatformsConstants: {
					iOS: "iOS",
				},
				prepareNativePlatformService: (this.prepareNativePlatformService = <
					any
				>{}),
				platformCommandHelper: (this.platformCommandHelper = {}),
				platformValidationService: (this.platformValidationService = {}),
				buildController: (this.buildController = <any>{
					buildPlatform: async () => {
						this.archiveCalls++;
						return "/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa";
					},
				}),
				platformsDataService: {
					getPlatformData: (platform: string) => {
						chai.assert.equal(platform, "iOS");
						return this.iOSPlatformData;
					},
				},
				applePortalSessionService: {
					createUserSession: () => {
						return {
							areCredentialsValid: true,
						};
					},
				},
			},
		});

		this.projectData.initializeProjectData(this.iOSPlatformData.projectRoot);
		this.command = this.injector.resolveCommand("appstore");
	}

	initInjector(services?: {
		commands?: { [service: string]: any };
		services?: { [service: string]: any };
	}) {
		this.injector = new yok.Yok();
		if (services) {
			for (const cmd in services.commands) {
				this.injector.registerCommand(cmd, services.commands[cmd]);
			}
			for (const serv in services.services) {
				this.injector.register(serv, services.services[serv]);
			}
		}

		this.injector.register("projectDataService", ProjectDataServiceStub);
	}

	assert() {
		this.prompter.assert();
		chai.assert.equal(
			this.archiveCalls,
			this.expectedArchiveCalls,
			"Mismatched number of iOSProjectService.archive calls.",
		);
		chai.assert.equal(
			this.itmsTransporterServiceUploadCalls,
			this.expectedItmsTransporterServiceUploadCalls,
			"Mismatched number of itmsTransporterService.upload calls.",
		);
	}

	expectItunesPrompt() {
		this.prompter.expect({
			strings: { "Apple ID": AppStore.itunesconnect.user },
			passwords: { "Apple ID password": AppStore.itunesconnect.pass },
		});
	}

	expectArchive() {
		this.expectedArchiveCalls = 1;
		this.buildController.prepareAndBuild = (iOSBuildData: IOSBuildData) => {
			this.archiveCalls++;
			chai.assert.equal(iOSBuildData.projectDir, "/Users/person/git/MyProject");
			chai.assert.isTrue(iOSBuildData.buildForAppStore);
			return Promise.resolve(
				"/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa",
			);
		};
	}

	expectITMSTransporterUpload() {
		this.expectedItmsTransporterServiceUploadCalls = 1;
		this.itmsTransporterService.validate = () => Promise.resolve();
		this.itmsTransporterService.upload = (options: IITMSData) => {
			this.itmsTransporterServiceUploadCalls++;
			chai.assert.equal(
				options.ipaFilePath,
				"/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa",
			);
			chai.assert.equal(
				options.credentials.username,
				AppStore.itunesconnect.user,
			);
			chai.assert.equal(
				options.credentials.password,
				AppStore.itunesconnect.pass,
			);
			chai.assert.equal(options.verboseLogging, false);
			return Promise.resolve();
		};
	}

	async noArgs() {
		this.expectItunesPrompt();
		this.expectArchive();
		this.expectITMSTransporterUpload();

		await this.command.execute([]);

		this.assert();
	}

	async itunesconnectArgs() {
		this.expectArchive();
		this.expectITMSTransporterUpload();

		await this.command.execute([
			AppStore.itunesconnect.user,
			AppStore.itunesconnect.pass,
		]);

		this.assert();
	}

	async teamIdOption() {
		this.expectItunesPrompt();
		this.expectArchive();
		this.expectITMSTransporterUpload();

		this.options.teamId = "MyTeamID";

		await this.command.execute([]);

		this.assert();
	}
}

describe("ns appstore", () => {
	it("without args, prompts for itunesconnect credentionals, prepares, archives and uploads", async () => {
		const instance = new AppStore();
		instance.before();
		await instance.noArgs();
	});
	it("with command line itunesconnect credentionals, prepares, archives and uploads", async () => {
		const instance = new AppStore();
		instance.before();
		await instance.itunesconnectArgs();
	});
	it("passes --team-id to xcodebuild exportArchive", async () => {
		const instance = new AppStore();
		instance.before();
		await instance.teamIdOption();
	});
});
