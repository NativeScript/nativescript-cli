import { assert } from "chai";
import { EventEmitter } from "events";
import * as sinon from "sinon";
import { IOSApplicationManager } from "../../../mobile/ios/device/ios-application-manager";

class FakeLldb extends EventEmitter {
	public pid = 1;
	public input: string[] = [];
	public exitCode: number = null;
	public signalCode: string = null;
	public killed = false;
	public stdout = new EventEmitter();
	public stderr = new EventEmitter();
	public stdin = Object.assign(new EventEmitter(), {
		write: (text: string) => {
			this.input.push(text);
			return true;
		},
		end: (text?: string) => {
			if (text) {
				this.input.push(text);
			}
			if (this.exitsOnEnd) {
				setImmediate(() => this.exit());
			}
		},
	});

	constructor(
		private exitsOnEnd: boolean,
		private events: string[],
	) {
		super();
	}

	public kill() {
		this.killed = true;
		this.exit();
	}

	private exit() {
		this.exitCode = 0;
		this.events.push("lldb exit");
		this.emit("exit", 0, null);
		this.emit("close", 0, null);
	}
}

describe("IOSApplicationManager native debugger", () => {
	const deviceId = "device";
	const appData = { appId: "org.app", projectName: "app", projectDir: "/app" };
	let clock: sinon.SinonFakeTimers;

	afterEach(() => {
		clock?.restore();
		clock = undefined;
	});

	const setup = (pid?: number, lldbExitsOnEnd = true) => {
		const events: string[] = [];
		const lldbs: FakeLldb[] = [];
		const spawned: { args: string[]; options: any }[] = [];
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
				start: async () => {
					events.push("start");
					return { [deviceId]: [{ deviceId, pid }] };
				},
				stop: async () => {
					events.push("stop");
					return {};
				},
				apps: async () => ({
					[deviceId]: [{ response: [{ CFBundleIdentifier: appData.appId }] }],
				}),
			},
			{ justlaunch: true },
			new Proxy({}, { get: () => () => {} }),
			{
				spawn: (command: string, args: string[], options: any) => {
					spawned.push({ args: [command, ...args], options });
					const lldb = new FakeLldb(lldbExitsOnEnd, events);
					lldbs.push(lldb);
					return lldb;
				},
			},
		);
		return { manager, lldbs, spawned, events };
	};

	const debugBrk = { ...appData, waitForDebugger: true };

	it("attaches lldb to an app that waits for the JS debugger", async () => {
		const { manager, lldbs, spawned } = setup(42);

		await manager.restartApplication(debugBrk);

		assert.deepEqual(
			spawned.map((s) => s.args),
			[["xcrun", "lldb"]],
		);
		assert.include(lldbs[0].input[0], `device select ${deviceId}`);
		assert.include(lldbs[0].input[0], "device process attach -p 42");
	});

	it("runs lldb outside the CLI's process group", async () => {
		const { manager, spawned } = setup(42);

		await manager.restartApplication(debugBrk);

		assert.isTrue(spawned[0].options?.detached);
	});

	it("continues the app once, after the attach stopped it", async () => {
		clock = sinon.useFakeTimers();
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);
		const [lldb] = lldbs;
		assert.lengthOf(lldb.input, 1);

		lldb.stdout.emit("data", Buffer.from("Process 42 sto"));
		assert.lengthOf(lldb.input, 1);
		lldb.stdout.emit("data", Buffer.from("pped\n"));
		lldb.stdout.emit("data", Buffer.from("Process 42 stopped\n"));
		await clock.tickAsync(60000);

		assert.deepEqual(lldb.input.slice(1), ["process continue\n"]);
	});

	it("continues the app when lldb reports the stop on stderr", async () => {
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);
		lldbs[0].stderr.emit("data", Buffer.from("Process 42 stopped\n"));

		assert.deepEqual(lldbs[0].input.slice(1), ["process continue\n"]);
	});

	it("continues the app when lldb never reports the stop", async () => {
		clock = sinon.useFakeTimers();
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);
		const [lldb] = lldbs;
		await clock.tickAsync(1000);
		assert.lengthOf(lldb.input, 1);

		await clock.tickAsync(60000);
		assert.deepEqual(lldb.input.slice(1), ["process continue\n"]);
	});

	it("continues the app on a stop reported after the timeout", async () => {
		clock = sinon.useFakeTimers();
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);
		const [lldb] = lldbs;
		await clock.tickAsync(60000);
		lldb.stdout.emit("data", Buffer.from("Process 42 stopped\n"));
		lldb.stdout.emit("data", Buffer.from("Process 42 stopped\n"));

		assert.deepEqual(lldb.input.slice(1), [
			"process continue\n",
			"process continue\n",
		]);
	});

	it("doesn't continue the app again once lldb resumed it", async () => {
		clock = sinon.useFakeTimers();
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);
		const [lldb] = lldbs;
		await clock.tickAsync(60000);
		lldb.stdout.emit("data", Buffer.from("Process 42 resuming\n"));
		lldb.stdout.emit("data", Buffer.from("Process 42 stopped\n"));

		assert.deepEqual(lldb.input.slice(1), ["process continue\n"]);
	});

	it("survives a broken pipe to lldb", async () => {
		const { manager, lldbs } = setup(42);

		await manager.restartApplication(debugBrk);

		assert.doesNotThrow(() =>
			lldbs[0].stdin.emit("error", new Error("write EPIPE")),
		);
	});

	it("doesn't attach to an app that doesn't wait", async () => {
		const { manager, spawned } = setup(42);

		await manager.restartApplication(appData);

		assert.deepEqual(spawned, []);
	});

	it("doesn't attach without a process id", async () => {
		const { manager, spawned } = setup(-1);

		await manager.restartApplication(debugBrk);

		assert.deepEqual(spawned, []);
	});

	it("detaches before stopping the app", async () => {
		const { manager, lldbs, events } = setup(42);

		await manager.restartApplication(debugBrk);
		events.length = 0;
		await manager.stopApplication(appData);

		assert.include(lldbs[0].input[lldbs[0].input.length - 1], "process detach");
		assert.deepEqual(events, ["lldb exit", "stop"]);
		assert.isFalse(lldbs[0].killed);
	});

	it("kills lldb when it doesn't exit after detaching", async () => {
		clock = sinon.useFakeTimers();
		const { manager, lldbs, events } = setup(42, false);

		await manager.restartApplication(debugBrk);
		events.length = 0;
		const stopped = manager.stopApplication(appData);
		await clock.tickAsync(1000);
		assert.deepEqual(events, []);

		await clock.tickAsync(60000);
		await stopped;

		assert.isTrue(lldbs[0].killed);
		assert.deepEqual(events, ["lldb exit", "stop"]);
	});

	it("detaches before launching the app without waiting for the debugger", async () => {
		const { manager, lldbs, events, spawned } = setup(42);

		await manager.startApplication(debugBrk);
		events.length = 0;
		await manager.startApplication(appData);

		assert.include(lldbs[0].input[lldbs[0].input.length - 1], "process detach");
		assert.deepEqual(events, ["lldb exit", "start"]);
		assert.lengthOf(spawned, 1);
	});
});
