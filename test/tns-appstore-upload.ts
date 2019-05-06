import { PublishIOS } from "../lib/commands/appstore-upload";
import { PrompterStub, LoggerStub, ProjectDataStub } from "./stubs";
import * as chai from "chai";
import * as yok from "../lib/common/yok";
import { BuildPlatformService } from "../lib/services/platform/build-platform-service";
import { PreparePlatformService } from "../lib/services/platform/prepare-platform-service";
import { MainController } from "../lib/controllers/main-controller";
import { WorkflowDataService } from "../lib/services/workflow/workflow-data-service";

class AppStore {
	static itunesconnect = {
		user: "person@private.com",
		pass: "god"
	};

	// Services
	injector: IInjector;
	command: ICommand;
	options: any;
	prompter: PrompterStub;
	projectData: ProjectDataStub;
	buildPlatformService: BuildPlatformService;
	preparePlatformService: PreparePlatformService;
	platformCommandsService: any;
	platformValidationService: any;
	mainController: MainController;
	iOSPlatformData: any;
	iOSProjectService: any;
	workflowDataService: WorkflowDataService;
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
			"projectRoot": "/Users/person/git/MyProject"
		};
		this.initInjector({
			commands: {
				"appstore": PublishIOS
			},
			services: {
				"errors": {},
				"fs": {},
				"hostInfo": {},
				"itmsTransporterService": this.itmsTransporterService = {},
				"logger": this.loggerService = new LoggerStub(),
				"options": this.options = {},
				"prompter": this.prompter = new PrompterStub(),
				"projectData": this.projectData = new ProjectDataStub(),
				"stringParameterBuilder": {},
				"devicePlatformsConstants": {
					"iOS": "iOS"
				},
				"preparePlatformService": this.preparePlatformService = <any>{},
				"platformCommandsService": this.platformCommandsService = {},
				"platformValidationService": this.platformValidationService = {},
				"mainController": this.mainController = <any>{
					buildPlatform: () => ({})
				},
				"buildPlatformService": this.buildPlatformService = <any>{
					buildPlatform: async () => {
						this.archiveCalls++;
						return "/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa";
					}
				},
				"platformsData": {
					getPlatformData: (platform: string) => {
						chai.assert.equal(platform, "iOS");
						return this.iOSPlatformData;
					}
				},
				"workflowDataService": this.workflowDataService = <any>{},
			}
		});
		this.projectData.initializeProjectData(this.iOSPlatformData.projectRoot);
		this.command = this.injector.resolveCommand("appstore");
	}

	initInjector(services?: { commands?: { [service: string]: any }, services?: { [service: string]: any } }) {
		this.injector = new yok.Yok();
		if (services) {
			for (const cmd in services.commands) {
				this.injector.registerCommand(cmd, services.commands[cmd]);
			}
			for (const serv in services.services) {
				this.injector.register(serv, services.services[serv]);
			}
		}
	}

	assert() {
		this.prompter.assert();
		chai.assert.equal(this.archiveCalls, this.expectedArchiveCalls, "Mismatched number of iOSProjectService.archive calls.");
		chai.assert.equal(this.itmsTransporterServiceUploadCalls, this.expectedItmsTransporterServiceUploadCalls, "Mismatched number of itmsTransporterService.upload calls.");
	}

	expectItunesPrompt() {
		this.prompter.expect({
			strings: { "Apple ID": AppStore.itunesconnect.user },
			passwords: { "Apple ID password": AppStore.itunesconnect.pass },
		});
	}

	expectArchive() {
		this.expectedArchiveCalls = 1;
		this.mainController.buildPlatform = (platform: string, projectDir: string, options) => {
			this.archiveCalls++;
			chai.assert.equal(projectDir, "/Users/person/git/MyProject");
			chai.assert.isTrue(options.buildForAppStore);
			return Promise.resolve("/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa");
		};
	}

	expectITMSTransporterUpload() {
		this.expectedItmsTransporterServiceUploadCalls = 1;
		this.itmsTransporterService.upload = (options: IITMSData) => {
			this.itmsTransporterServiceUploadCalls++;
			chai.assert.equal(options.ipaFilePath, "/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa");
			chai.assert.equal(options.username, AppStore.itunesconnect.user);
			chai.assert.equal(options.password, AppStore.itunesconnect.pass);
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

		await this.command.execute([AppStore.itunesconnect.user, AppStore.itunesconnect.pass]);

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

describe("tns appstore", () => {
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
