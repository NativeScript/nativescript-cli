import { assert } from "chai";
import { EventEmitter } from "events";
import { IOSApplicationManager } from "../../../mobile/ios/device/ios-application-manager";

describe("IOSApplicationManager native debugger", () => {
	const deviceId = "device";
	const appData = { appId: "org.app", projectName: "app", projectDir: "/app" };

	const setup = (pid?: number) => {
		const lldbInput: string[] = [];
		const lldbOutput = new EventEmitter();
		const spawned: string[][] = [];
		const manager = new (<any>IOSApplicationManager)(
			{ trace: () => {}, info: () => {} },
			{},
			{
				deviceInfo: { identifier: deviceId },
				destroyDebugSocket: async () => {},
			},
			{},
			{},
			{
				start: async () => ({ [deviceId]: [{ deviceId, pid }] }),
				stop: async () => ({}),
				apps: async () => ({}),
			},
			{ justlaunch: true },
			new Proxy({}, { get: () => () => {} }),
			{
				spawn: (command: string, args: string[]) => {
					spawned.push([command, ...args]);
					return {
						on: () => {},
						stdout: lldbOutput,
						stdin: {
							write: (text: string) => lldbInput.push(text),
							end: () => {},
						},
					};
				},
			},
		);
		return { manager, lldbInput, lldbOutput, spawned };
	};

	it("attaches lldb to an app that waits for the JS debugger", async () => {
		const { manager, lldbInput, spawned } = setup(42);

		await manager.restartApplication({ ...appData, waitForDebugger: true });

		assert.deepEqual(spawned, [["xcrun", "lldb"]]);
		assert.include(lldbInput[0], `device select ${deviceId}`);
		assert.include(lldbInput[0], "device process attach -p 42");
	});

	it("continues the app once, after the attach stopped it", async () => {
		const { manager, lldbInput, lldbOutput } = setup(42);

		await manager.restartApplication({ ...appData, waitForDebugger: true });
		assert.lengthOf(lldbInput, 1);

		lldbOutput.emit("data", Buffer.from("Process 42 sto"));
		assert.lengthOf(lldbInput, 1);
		lldbOutput.emit("data", Buffer.from("pped\n"));
		lldbOutput.emit("data", Buffer.from("Process 42 stopped\n"));

		assert.deepEqual(lldbInput.slice(1), ["process continue\n"]);
	});

	it("doesn't attach to an app that doesn't wait", async () => {
		const { manager, spawned } = setup(42);

		await manager.restartApplication(appData);

		assert.deepEqual(spawned, []);
	});

	it("doesn't attach without a process id", async () => {
		const { manager, spawned } = setup(-1);

		await manager.restartApplication({ ...appData, waitForDebugger: true });

		assert.deepEqual(spawned, []);
	});

	it("detaches when the app stops", async () => {
		const { manager, lldbInput } = setup(42);

		await manager.restartApplication({ ...appData, waitForDebugger: true });
		await manager.stopApplication(appData);

		assert.include(lldbInput[lldbInput.length - 1], "process detach");
	});
});
