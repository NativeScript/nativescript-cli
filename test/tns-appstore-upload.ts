import { PublishIOS } from "../lib/commands/appstore-upload";
import { PrompterStub, LoggerStub, ProjectDataStub } from "./stubs";
import * as chai from "chai";
import * as yok from "../lib/common/yok";

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
	platformService: any;
	iOSPlatformData: any;
	iOSProjectService: any;
	xcodebuildService: IXcodebuildService;
	loggerService: LoggerStub;
	itmsTransporterService: any;

	// Counters
	preparePlatformCalls: number = 0;
	expectedPreparePlatformCalls: number = 0;
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
				"platformService": this.platformService = {},
				"platformsData": {
					getPlatformData: (platform: string) => {
						chai.assert.equal(platform, "iOS");
						return this.iOSPlatformData;
					}
				},
				"xcodebuildService": this.xcodebuildService = {
					buildForDevice: async () => {
						this.archiveCalls++;
						return "/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa";
					},
					buildForSimulator: async () => ({}),
					buildForAppStore: async () => {
						this.archiveCalls++;
						return "/Users/person/git/MyProject/platforms/ios/archive/MyProject.ipa";
					}
				}
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
		chai.assert.equal(this.preparePlatformCalls, this.expectedPreparePlatformCalls, "Mismatched number of $platformService.preparePlatform calls.");
		chai.assert.equal(this.archiveCalls, this.expectedArchiveCalls, "Mismatched number of iOSProjectService.archive calls.");
		chai.assert.equal(this.itmsTransporterServiceUploadCalls, this.expectedItmsTransporterServiceUploadCalls, "Mismatched number of itmsTransporterService.upload calls.");
	}

	expectItunesPrompt() {
		this.prompter.expect({
			strings: { "Apple ID": AppStore.itunesconnect.user },
			passwords: { "Apple ID password": AppStore.itunesconnect.pass },
		});
	}

	expectPreparePlatform() {
		this.expectedPreparePlatformCalls = 1;
		this.platformService.preparePlatform = (platformInfo: IPreparePlatformInfo) => {
			chai.assert.equal(platformInfo.platform, "iOS");
			this.preparePlatformCalls++;
			return Promise.resolve(true);
		};
	}

	expectArchive() {
		this.expectedArchiveCalls = 1;
		this.xcodebuildService.buildForDevice = (platformData: any, projectData: IProjectData) => {
			this.archiveCalls++;
			chai.assert.equal(projectData.projectDir, "/Users/person/git/MyProject");
			return Promise.resolve("/Users/person/git/MyProject/platforms/ios/archive/MyProject.xcarchive");
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
		this.expectPreparePlatform();
		this.expectArchive();
		this.expectITMSTransporterUpload();

		await this.command.execute([]);

		this.assert();
	}

	async itunesconnectArgs() {
		this.expectPreparePlatform();
		this.expectArchive();
		this.expectITMSTransporterUpload();

		await this.command.execute([AppStore.itunesconnect.user, AppStore.itunesconnect.pass]);

		this.assert();
	}

	async teamIdOption() {
		this.expectItunesPrompt();
		this.expectPreparePlatform();
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
