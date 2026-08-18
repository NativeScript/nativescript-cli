import { Yok } from "../../../lib/common/yok";
import { GradleBuildService } from "../../../lib/services/android/gradle-build-service";
import { assert } from "chai";
import { IInjector } from "../../../lib/common/definitions/yok";
import { IAndroidBuildData } from "../../../lib/definitions/build";

const createDevice = (
	identifier: string,
	abis: string[],
	isEmulator = false,
): any => ({
	deviceInfo: { identifier, abis, platform: "android" },
	isEmulator,
});

function createTestInjector(devices: any[]): IInjector {
	const injector = new Yok();
	injector.register("childProcess", {
		on: (): void => undefined,
		removeListener: (): void => undefined,
	});
	injector.register("devicesService", {
		getDevicesForPlatform: () => devices,
	});
	injector.register("gradleBuildArgsService", {
		getBuildTaskArgs: async () => ["assembleDebug"],
		getCleanTaskArgs: () => ["clean"],
		getBuildLoggingArgs: (): string[] => [],
	});
	injector.register("gradleCommandService", {
		executeCommand: async (args: string[]): Promise<any> => {
			executedArgs = args;
			return null;
		},
	});
	injector.register("gradleBuildService", GradleBuildService);

	return injector;
}

let executedArgs: string[] = null;

const buildProject = async (
	devices: any[],
	buildData: Partial<IAndroidBuildData>,
): Promise<string[]> => {
	executedArgs = null;
	const injector = createTestInjector(devices);
	const gradleBuildService = injector.resolve("gradleBuildService");
	await gradleBuildService.buildProject("projectRoot", <IAndroidBuildData>{
		platform: "android",
		...buildData,
	});

	return executedArgs;
};

describe("GradleBuildService", () => {
	describe("abi filtering", () => {
		it("passes the abis of the connected devices", async () => {
			const args = await buildProject(
				[
					createDevice("device1", ["arm64-v8a", "armeabi-v7a"]),
					createDevice("emulator1", ["x86_64", "x86"], true),
				],
				{ buildFilterDevicesArch: true },
			);

			assert.include(args, "-PabiFilters=arm64-v8a,x86_64");
		});

		it("passes the abi of the selected device only", async () => {
			const args = await buildProject(
				[
					createDevice("device1", ["arm64-v8a"]),
					createDevice("emulator1", ["x86_64"], true),
				],
				{ buildFilterDevicesArch: true, device: "device1" },
			);

			assert.include(args, "-PabiFilters=arm64-v8a");
		});

		it("passes the abis of the emulators only when --emulator is used", async () => {
			const args = await buildProject(
				[
					createDevice("device1", ["arm64-v8a"]),
					createDevice("emulator1", ["x86_64"], true),
				],
				{ buildFilterDevicesArch: true, emulator: true },
			);

			assert.include(args, "-PabiFilters=x86_64");
		});

		it("deduplicates the abis", async () => {
			const args = await buildProject(
				[
					createDevice("device1", ["arm64-v8a"]),
					createDevice("device2", ["arm64-v8a"]),
				],
				{ buildFilterDevicesArch: true },
			);

			assert.include(args, "-PabiFilters=arm64-v8a");
		});

		it("passes nothing when the filtering is off", async () => {
			const args = await buildProject(
				[createDevice("device1", ["arm64-v8a"])],
				{ buildFilterDevicesArch: false },
			);

			assert.isUndefined(args.find((a) => a.startsWith("-PabiFilters")));
		});

		it("passes nothing when no device reports its abis", async () => {
			const args = await buildProject([createDevice("device1", [])], {
				buildFilterDevicesArch: true,
			});

			assert.isUndefined(args.find((a) => a.startsWith("-PabiFilters")));
		});
	});
});
