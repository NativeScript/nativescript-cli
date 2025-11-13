import { assert } from "chai";
import * as _ from "lodash";
import { PrepareController } from "../../lib/controllers/prepare-controller";
import { MobileHelper } from "../../lib/common/mobile/mobile-helper";
import { InjectorStub, TempServiceStub } from "../stubs";
import { PREPARE_READY_EVENT_NAME } from "../../lib/constants";
import { IInjector } from "../../lib/common/definitions/yok";

const projectDir = "/path/to/my/projectDir";
const prepareData = {
	projectDir,
	release: false,
	hmr: false,
	env: {},
	watch: true,
	watchNative: true,
	uniqueBundle: 0,
};

let isCompileWithWatchCalled = false;
let isCompileWithoutWatchCalled = false;
let isNativePrepareCalled = false;
let isEnsuringAppResourcesExist = false;
let emittedEventNames: string[] = [];
let emittedEventData: any[] = [];

function createTestInjector(data: { hasNativeChanges: boolean }): IInjector {
	const injector = new InjectorStub();

	injector.register("platformController", {
		addPlatformIfNeeded: () => ({}),
	});

	injector.register("prepareNativePlatformService", {
		prepareNativePlatform: async () => {
			isNativePrepareCalled = true;
			return data.hasNativeChanges;
		},
	});

	injector.register("bundlerCompilerService", {
		on: () => ({}),
		emit: () => ({}),
		compileWithWatch: async () => {
			isCompileWithWatchCalled = true;
		},
		compileWithoutWatch: async () => {
			isCompileWithoutWatchCalled = true;
		},
	});

	injector.register("mobileHelper", MobileHelper);
	injector.register("prepareController", PrepareController);

	injector.register("nodeModulesDependenciesBuilder", {
		getProductionDependencies: () => <any>[],
	});

	injector.register("watchIgnoreListService", {
		addFileToIgnoreList: () => ({}),
		isFileInIgnoreList: () => false,
	});

	injector.register("analyticsService", {
		trackEventActionInGoogleAnalytics: () => ({}),
	});

	injector.register("tempService", TempServiceStub);
	injector.register("projectService", {
		ensureAppResourcesExist(projectDir: string): Promise<void> {
			isEnsuringAppResourcesExist = true;
			return;
		},
	});

	const prepareController: PrepareController =
		injector.resolve("prepareController");
	prepareController.emit = (eventName: string, eventData: any) => {
		emittedEventNames.push(eventName);
		emittedEventData.push(eventData);
		assert.isTrue(isCompileWithWatchCalled);
		assert.isTrue(isNativePrepareCalled);
		return true;
	};

	return injector;
}

describe("prepareController", () => {
	afterEach(() => {
		isNativePrepareCalled = false;
		isCompileWithWatchCalled = false;
		isCompileWithoutWatchCalled = false;
		isEnsuringAppResourcesExist = false;

		emittedEventNames = [];
		emittedEventData = [];
	});

	describe("preparePlatform with watch", () => {
		_.each(["iOS", "Android"], (platform) => {
			_.each([true, false], (hasNativeChanges) => {
				it(`should execute native prepare and webpack's compilation for ${platform} platform when hasNativeChanges is ${hasNativeChanges}`, async () => {
					const injector = createTestInjector({ hasNativeChanges });

					const prepareController: PrepareController =
						injector.resolve("prepareController");
					await prepareController.prepare({ ...prepareData, platform });

					assert.isTrue(isCompileWithWatchCalled);
					assert.isTrue(isNativePrepareCalled);
					assert.isTrue(isEnsuringAppResourcesExist);
				});
			});
			it(`should respect native changes that are made before the initial preparation of the project had been done for ${platform}`, async () => {
				const injector = createTestInjector({ hasNativeChanges: false });

				const prepareController: PrepareController =
					injector.resolve("prepareController");

				const prepareNativePlatformService = injector.resolve(
					"prepareNativePlatformService",
				);
				prepareNativePlatformService.prepareNativePlatform = async () => {
					const nativeFilesWatcher = (<any>prepareController).watchersData[
						projectDir
					][platform.toLowerCase()].nativeFilesWatcher;
					nativeFilesWatcher.emit(
						"all",
						"change",
						"my/project/App_Resources/some/file",
					);
					isNativePrepareCalled = true;
					return false;
				};

				await prepareController.prepare({ ...prepareData, platform });

				assert.lengthOf(emittedEventNames, 1);
				assert.lengthOf(emittedEventData, 1);
				assert.deepStrictEqual(emittedEventNames[0], PREPARE_READY_EVENT_NAME);
				assert.deepStrictEqual(emittedEventData[0], {
					files: [],
					staleFiles: [],
					hasNativeChanges: true,
					hasOnlyHotUpdateFiles: false,
					hmrData: null,
					platform: platform.toLowerCase(),
				});
			});
		});
	});

	describe("preparePlatform without watch", () => {
		_.each(["ios", "android"], (platform) => {
			it("shouldn't start the watcher when watch is false", async () => {
				const injector = createTestInjector({ hasNativeChanges: false });

				const prepareController: PrepareController =
					injector.resolve("prepareController");
				await prepareController.prepare({
					...prepareData,
					watch: false,
					platform,
				});

				assert.isTrue(isNativePrepareCalled);
				assert.isTrue(isCompileWithoutWatchCalled);
				assert.isFalse(isCompileWithWatchCalled);
				assert.isTrue(isEnsuringAppResourcesExist);
			});
		});
	});
});
