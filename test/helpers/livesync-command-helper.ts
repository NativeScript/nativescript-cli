import { assert } from "chai";
import { EventEmitter } from "events";
import { InjectorStub } from "../stubs";
import { LiveSyncCommandHelper } from "../../lib/helpers/livesync-command-helper";

const device = (identifier: string, platform: string = "iOS"): any => ({
	deviceInfo: { identifier, platform },
	isEmulator: false,
});

function createTestInjector(attached: any[]) {
	const injector = new InjectorStub();
	const runController = Object.assign(new EventEmitter(), {
		stops: <any[]>[],
		runs: <any[]>[],
		stop: async (data: any): Promise<void> =>
			void runController.stops.push(data),
		run: async (data: any): Promise<void> => void runController.runs.push(data),
	});

	injector.register("options", {
		argv: {},
		watch: true,
	});
	injector.register("projectData", { projectDir: "/project" });
	injector.register("runController", runController);
	injector.register("devicesService", {
		initialize: async (): Promise<void> => undefined,
		getDeviceInstances: () => attached,
	});
	injector.register("buildDataService", {
		getBuildData: (projectDir: string, platform: string, data: any) => ({
			...data,
			projectDir,
			platform,
		}),
	});
	injector.register("androidBundleValidatorHelper", {
		validateDeviceApiLevel: (): void => undefined,
	});
	injector.register("buildController", { build: async () => "/package" });
	injector.register("deployController", {});
	injector.register("iosDeviceOperations", {
		setShouldDispose: (): void => undefined,
	});
	injector.register("iOSSimulatorLogProvider", {
		setShouldDispose: (): void => undefined,
	});
	injector.register("analyticsService", {
		setShouldDispose: (): void => undefined,
	});
	injector.register("cleanupService", {
		setShouldDispose: (): void => undefined,
	});
	injector.register("mobileHelper", {
		isApplePlatform: () => true,
		platformNames: ["iOS", "Android"],
	});
	injector.register("liveSyncCommandHelper", LiveSyncCommandHelper);

	return { injector, runController };
}

const identifiers = (descriptors: any[]): string[] =>
	descriptors.map((descriptor) => descriptor.identifier);

describe("LiveSyncCommandHelper", () => {
	describe("executeLiveSyncOperation with restartLiveSync", () => {
		it("restarts only the devices the session was given, not every attached one", async () => {
			const attached = [device("picked"), device("other")];
			const { injector, runController } = createTestInjector(attached);
			const helper = injector.resolve("liveSyncCommandHelper");

			await helper.executeLiveSyncOperation([attached[0]], "iOS", {
				restartLiveSync: true,
			});

			assert.lengthOf(runController.stops, 1);
			assert.deepEqual(runController.stops[0].deviceIdentifiers, ["picked"]);
			assert.lengthOf(runController.runs, 1);
			assert.deepEqual(identifiers(runController.runs[0].deviceDescriptors), [
				"picked",
			]);
		});

		it("drops a session device that is no longer attached", async () => {
			const gone = device("gone");
			const attached = [device("picked")];
			const { injector, runController } = createTestInjector(attached);
			const helper = injector.resolve("liveSyncCommandHelper");

			await helper.executeLiveSyncOperation([attached[0], gone], "iOS", {
				restartLiveSync: true,
			});

			assert.deepEqual(identifiers(runController.runs[0].deviceDescriptors), [
				"picked",
			]);
		});
	});
});
