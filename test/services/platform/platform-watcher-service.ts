import { Yok } from "../../../lib/common/yok";
import { PlatformWatcherService } from "../../../lib/services/platform/platform-watcher-service";
import { assert } from "chai";
import { INITIAL_SYNC_EVENT_NAME } from "../../../lib/constants";

const projectData = <any>{ projectDir: "myProjectDir", getAppResourcesRelativeDirectoryPath: () => "/my/app_resources/dir/path" };
const preparePlatformData = <any>{ };

let isCompileWithWatchCalled = false;
let isNativePrepareCalled = false;
let emittedEventNames: string[] = [];
let emittedEventData: any[] = [];

function createTestInjector(data: { hasNativeChanges: boolean }): IInjector {
	const injector = new Yok();
	injector.register("logger", ({
		out: () => ({}),
		trace: () => ({})
	}));
	injector.register("preparePlatformService", ({
		prepareNativePlatform: async () => {
			isNativePrepareCalled = true;
			return data.hasNativeChanges;
		}
	}));
	injector.register("webpackCompilerService", ({
		on: () => ({}),
		emit: () => ({}),
		compileWithWatch: async () => {
			isCompileWithWatchCalled = true;
		}
	}));
	injector.register("platformWatcherService", PlatformWatcherService);

	const platformWatcherService: PlatformWatcherService = injector.resolve("platformWatcherService");
	platformWatcherService.emit = (eventName: string, eventData: any) => {
		emittedEventNames.push(eventName);
		emittedEventData.push(eventData);
		assert.isTrue(isCompileWithWatchCalled);
		assert.isTrue(isNativePrepareCalled);
		return true;
	};

	return injector;
}

describe("PlatformWatcherService", () => {
	beforeEach(() => {
		emittedEventNames = [];
		emittedEventData = [];
	});
	describe("startWatcher", () => {
		describe("initialSyncEvent", () => {
			_.each(["iOS", "Android"], platform => {
				_.each([true, false], hasNativeChanges => {
					it(`should emit after native prepare and webpack's compilation are done for ${platform} platform and hasNativeChanges is ${hasNativeChanges}`, async () => {
						const injector = createTestInjector({ hasNativeChanges });

						const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
						const platformWatcherService: PlatformWatcherService = injector.resolve("platformWatcherService");
						await platformWatcherService.startWatchers(platformData, projectData, preparePlatformData);

						assert.lengthOf(emittedEventNames, 1);
						assert.lengthOf(emittedEventData, 1);
						assert.deepEqual(emittedEventNames[0], INITIAL_SYNC_EVENT_NAME);
						assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges });
					});
				});
			});

			_.each(["iOS", "Android"], platform => {
				it(`should respect native changes that are made before the initial preparation of the project had been done for ${platform}`, async () => {
					const injector = createTestInjector({ hasNativeChanges: false });

					const platformWatcherService: PlatformWatcherService = injector.resolve("platformWatcherService");

					const preparePlatformService = injector.resolve("preparePlatformService");
					preparePlatformService.prepareNativePlatform = async () => {
						const nativeFilesWatcher = (<any>platformWatcherService).watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher;
						nativeFilesWatcher.emit("all", "change", "my/project/App_Resources/some/file");
						isNativePrepareCalled = true;
						return false;
					};

					const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
					await platformWatcherService.startWatchers(platformData, projectData, preparePlatformData);

					assert.lengthOf(emittedEventNames, 1);
					assert.lengthOf(emittedEventData, 1);
					assert.deepEqual(emittedEventNames[0], INITIAL_SYNC_EVENT_NAME);
					assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges: true });
				});
			});
		});
		describe("filesChangeEventData event", () => {
			_.each(["iOS", "Android"], platform => {
				it(`shouldn't emit filesChangeEventData before initialSyncEvent if js code is changed before the initial preparation of project has been done for ${platform}`, async () => {
					const injector = createTestInjector({ hasNativeChanges: false });
					const hasNativeChanges = false;

					const preparePlatformService = injector.resolve("preparePlatformService");
					const webpackCompilerService = injector.resolve("webpackCompilerService");
					preparePlatformService.prepareNativePlatform = async () => {
						webpackCompilerService.emit("webpackEmittedFiles", ["/some/file/path"]);
						isNativePrepareCalled = true;
						return hasNativeChanges;
					};

					const platformWatcherService: PlatformWatcherService = injector.resolve("platformWatcherService");
					const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
					await platformWatcherService.startWatchers(platformData, projectData, preparePlatformData);

					assert.lengthOf(emittedEventNames, 1);
					assert.lengthOf(emittedEventData, 1);
					assert.deepEqual(emittedEventNames[0], INITIAL_SYNC_EVENT_NAME);
					assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges });
				});
			});
		});
	});
});
