import * as assert from "assert";
import { IOSDeviceLiveSyncService } from "../../../lib/services/livesync/ios-device-livesync-service";

describe("IOSDeviceLiveSyncService", () => {
	const projectData: any = {
		projectName: "app",
		projectDir: "/app",
		projectIdentifiers: { ios: "org.app" },
	};

	const restart = async (waitForDebugger: boolean) => {
		const calls: string[] = [];
		const ensureAppStartedValues: boolean[] = [];
		const device: any = {
			applicationManager: {
				restartApplication: async () => {
					calls.push("restart");
				},
			},
			getDebugSocket: async (
				_appId: string,
				_projectName: string,
				_projectDir: string,
				ensureAppStarted: boolean
			) => {
				calls.push("socket");
				ensureAppStartedValues.push(ensureAppStarted);
				return { on: () => {}, removeAllListeners: () => {} };
			},
		};
		const service = new (<any>IOSDeviceLiveSyncService)(
			{ trace: () => {} },
			{},
			{},
			{},
			{},
			{},
			device
		);

		await service.restartApplication(projectData, {
			deviceAppData: { appIdentifier: "org.app" },
			useHotModuleReload: true,
			waitForDebugger,
		});

		return { calls, ensureAppStartedValues };
	};

	it("connects to the app it restarted without starting it again", async () => {
		const { calls, ensureAppStartedValues } = await restart(false);

		assert.deepStrictEqual(calls, ["restart", "socket"]);
		assert.deepStrictEqual(ensureAppStartedValues, [false]);
	});

	it("starts the app again when the restarted instance waits for a debugger", async () => {
		const { ensureAppStartedValues } = await restart(true);

		assert.deepStrictEqual(ensureAppStartedValues, [true]);
	});
});
