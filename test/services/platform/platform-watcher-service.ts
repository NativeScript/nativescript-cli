import { Yok } from "../../../lib/common/yok";
import { PlatformWatcherService } from "../../../lib/services/platform/platform-watcher-service";
import { assert } from "chai";

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
	injector.register("platformNativeService", ({
		preparePlatform: async () => {
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

	const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");
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
		describe("initialSyncEventData event", () => {
			_.each(["iOS", "Android"], platform => {
				_.each([true, false], hasNativeChanges => {
					it(`should emit after native prepare and webpack's compilation are done for ${platform} platform and hasNativeChanges is ${hasNativeChanges}`, async () => {
						const injector = createTestInjector({ hasNativeChanges });

						const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
						const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");
						await platformWatcherService.startWatcher(platformData, projectData, preparePlatformData);

						assert.lengthOf(emittedEventNames, 1);
						assert.lengthOf(emittedEventData, 1);
						assert.deepEqual(emittedEventNames[0], "initialSyncEventData");
						assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges });
					});
				});
			});

			// TODO: Consider to write similar test for JS part if appropriate
			_.each(["iOS", "Android"], platform => {
				it(`should respect native changes that are made before the initial preparation of the project had been done for ${platform}`, async () => {
					const injector = createTestInjector({ hasNativeChanges: false });

					const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");

					const platformNativeService = injector.resolve("platformNativeService");
					platformNativeService.preparePlatform = async () => {
						const nativeFilesWatcher = (<any>platformWatcherService).watchersData[projectData.projectDir][platformData.platformNameLowerCase].nativeFilesWatcher;
						nativeFilesWatcher.emit("all", "change", "my/project/App_Resources/some/file");
						isNativePrepareCalled = true;
						return false;
					};

					const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
					await platformWatcherService.startWatcher(platformData, projectData, preparePlatformData);

					assert.lengthOf(emittedEventNames, 1);
					assert.lengthOf(emittedEventData, 1);
					assert.deepEqual(emittedEventNames[0], "initialSyncEventData");
					assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges: true });
				});
			});
		});
		describe("filesChangeEventData event", () => {
			_.each(["iOS", "Android"], platform => {
				it(`shouldn't emit filesChangeEventData before initialSyncEventData if js code is changed before the initial preparation of project has been done for ${platform}`, async () => {
					const injector = createTestInjector({ hasNativeChanges: false });
					const hasNativeChanges = false;

					const platformNativeService = injector.resolve("platformNativeService");
					const webpackCompilerService = injector.resolve("webpackCompilerService");
					platformNativeService.preparePlatform = async () => {
						webpackCompilerService.emit("webpackEmittedFiles", ["/some/file/path"]);
						isNativePrepareCalled = true;
						return hasNativeChanges;
					};

					const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");
					const platformData = <any>{ platformNameLowerCase: platform.toLowerCase(), normalizedPlatformName: platform };
					await platformWatcherService.startWatcher(platformData, projectData, preparePlatformData);

					assert.lengthOf(emittedEventNames, 1);
					assert.lengthOf(emittedEventData, 1);
					assert.deepEqual(emittedEventNames[0], "initialSyncEventData");
					assert.deepEqual(emittedEventData[0], { platform: platform.toLowerCase(), hasNativeChanges });

					// TODO: assert /some/file/path is emitted
				});
			});
		});
	});
});
