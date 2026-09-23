import { assert } from "chai";
import { EventEmitter } from "events";
import { RunOnDeviceEvents } from "../../lib/constants";
import { getContractName } from "../../lib/common/di/contract";
import { Injector } from "../../lib/common/di/injector";
import { KeyShortcutRegistryService } from "../../lib/services/key-shortcut-registry";
import {
	findShortcut,
	KeyContextBase,
	KeyShortcut,
	KeyShortcutService,
	keyShortcuts,
	keyShortcutsEnabled,
	NsKeyContext,
	resolveShortcuts,
	restartShortcut,
} from "../../lib/services/key-shortcuts";

class FakeStdin extends EventEmitter {
	public isTTY: boolean = true;
	public rawMode: boolean = null;
	public resumeCount: number = 0;
	public pauseCount: number = 0;

	public setRawMode(value: boolean): any {
		this.rawMode = value;
		return this;
	}

	public resume(): any {
		this.resumeCount++;
		return this;
	}

	public pause(): any {
		this.pauseCount++;
		return this;
	}
}

const fakeInjector = (
	registrations: Map<any, any> = new Map<any, any>(),
): Injector => <Injector>(<any>{
		get: (token: any) =>
			registrations.get(token) ?? registrations.get(getContractName(token)),
	});

const baseContext = (): KeyContextBase => ({ injector: fakeInjector() });

const context = (overrides: Partial<NsKeyContext> = {}): NsKeyContext => ({
	...baseContext(),
	processType: "start",
	...overrides,
});

const keysOf = (shortcuts: KeyShortcut<any>[]): string[] =>
	shortcuts.map((shortcut) => shortcut.key);

const flush = async (): Promise<void> => {
	for (let i = 0; i < 5; i++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
};

describe("key shortcuts", () => {
	describe("resolveShortcuts", () => {
		it("drops shortcuts whose `when` says no, and keeps the rest", () => {
			const resolved = resolveShortcuts(
				[
					{
						key: "x",
						description: "Excluded",
						when: () => false,
						action: noop,
					},
					{ key: "y", description: "Included", when: () => true, action: noop },
					{ key: "z", description: "Unconditional", action: noop },
				],
				context(),
			);

			assert.deepEqual(keysOf(resolved), ["y", "z", "?"]);
		});

		it("asks `when` about a field the caller put on the context", () => {
			interface DeviceContext extends KeyContextBase {
				deviceConnected: boolean;
			}

			const resolved = resolveShortcuts<DeviceContext>(
				[
					{
						key: "d",
						description: "Needs a device",
						when: (ctx) => ctx.deviceConnected,
						action: noop,
					},
					{ key: "e", description: "Always", action: noop },
				],
				{ ...baseContext(), deviceConnected: false },
			);

			assert.deepEqual(keysOf(resolved), ["e", "?"]);
		});

		it("evaluates `when` exactly once per shortcut", () => {
			let calls = 0;
			resolveShortcuts(
				[
					{
						key: "x",
						description: "Counted",
						when: () => {
							calls++;
							return true;
						},
						action: noop,
					},
				],
				context(),
			);

			assert.equal(calls, 1);
		});

		it("lets a later entry win by key, at the position the key first took", () => {
			const resolved = resolveShortcuts(
				[
					{ key: "r", description: "First", action: noop },
					{ key: "w", description: "Watcher", action: noop },
					{ key: "r", description: "Second", action: noop },
				],
				context(),
			);

			assert.deepEqual(keysOf(resolved), ["r", "w", "?"]);
			assert.equal(resolved[0].description, "Second");
		});

		it("removes a shortcut when a later entry has no action", () => {
			const resolved = resolveShortcuts(
				[
					{ key: "w", description: "Watcher", action: noop },
					{ key: "w", description: "Watcher", action: undefined },
				],
				context(),
			);

			assert.deepEqual(keysOf(resolved), ["?"]);
		});

		it("refuses to let anything shadow the help key", () => {
			const resolved = resolveShortcuts(
				[{ key: "?", description: "Hijacked", action: noop }],
				context(),
			);

			assert.deepEqual(keysOf(resolved), ["?"]);
			assert.equal(resolved[0].description, "Show this help");
		});

		it("still offers help when a table tries to remove it", () => {
			const resolved = resolveShortcuts(
				[{ key: "?", description: "Gone", action: undefined }],
				context(),
			);

			assert.deepEqual(keysOf(resolved), ["?"]);
		});
	});

	describe("the built-in table", () => {
		it("offers every key while `ns start` owns the terminal", () => {
			const resolved = resolveShortcuts(
				keyShortcuts(),
				context({ platform: undefined, processType: "start" }),
			);

			assert.deepEqual(keysOf(resolved), [
				"a",
				"A",
				"i",
				"I",
				"v",
				"V",
				"r",
				"R",
				"B",
				"w",
				"c",
				"n",
				"?",
			]);
		});

		it("narrows to the watched platform inside an `ns run` child", () => {
			const resolved = resolveShortcuts(
				keyShortcuts(),
				context({ platform: "Android", processType: "run" }),
			);

			assert.deepEqual(keysOf(resolved), [
				"A",
				"r",
				"R",
				"B",
				"w",
				"c",
				"n",
				"?",
			]);
		});

		it("routes the IDE shortcuts through the context's commands service", async () => {
			const invoked: string[] = [];
			const dispatcher = fakeInjector(
				new Map<any, any>([
					[
						"commandsService",
						{
							runCommand: async (name: string): Promise<void> =>
								void invoked.push(name),
						},
					],
				]),
			);
			const ctx = context({ injector: dispatcher });
			const resolved = resolveShortcuts(keyShortcuts(), ctx);

			for (const key of ["A", "I", "V", "n"]) {
				await findShortcut(resolved, key).action(ctx);
			}

			assert.deepEqual(invoked, [
				"open|android",
				"open|ios",
				"open|visionos",
				"install",
			]);
		});
	});

	describe("restartShortcut", () => {
		const session = (
			overrides: {
				descriptors?: string[];
				devicesByPlatform?: { [platform: string]: string[] };
			} = {},
		) => {
			const restarts: any[] = [];
			const liveSyncOperations: any[] = [];
			const registrations = new Map<any, any>([
				[
					"runController",
					{
						restartApplication: async (data: any): Promise<void> =>
							void restarts.push(data),
						getDeviceDescriptors: () =>
							(overrides.descriptors || ["device-1"]).map((identifier) => ({
								identifier,
							})),
					},
				],
				[
					"projectDataService",
					{ getProjectData: () => ({ projectDir: "/project" }) },
				],
				[
					"devicesService",
					{
						getDevicesForPlatform: (platform: string) =>
							((overrides.devicesByPlatform || {})[platform] || []).map(
								(identifier) => ({ deviceInfo: { identifier } }),
							),
					},
				],
				[
					"liveSyncCommandHelper",
					{
						getDeviceInstances: async (platform: string) => [{ platform }],
						executeLiveSyncOperation: async (
							devices: any[],
							platform: string,
							options: any,
						): Promise<void> =>
							void liveSyncOperations.push({ devices, platform, options }),
					},
				],
			]);

			return {
				restarts,
				liveSyncOperations,
				ctx: (overrides: Partial<NsKeyContext> = {}): NsKeyContext => ({
					injector: fakeInjector(registrations),
					processType: "run",
					...overrides,
				}),
			};
		};

		it("names the key and the promise each variant makes", () => {
			assert.deepEqual(
				[
					restartShortcut(),
					restartShortcut({ full: true }),
					restartShortcut({ forceRebuildNativeApp: true }),
				].map((shortcut) => [shortcut.key, shortcut.description]),
				[
					["r", "Restart the app"],
					[
						"R",
						"Re-prepare and restart the app (rebuilds native app if needed)",
					],
					["B", "Rebuild native app and restart"],
				],
			);
		});

		it("restarts the app on the watched platform's devices", async () => {
			const { restarts, ctx } = session({
				descriptors: ["android-1", "ios-1"],
				devicesByPlatform: { Android: ["android-1", "android-2"] },
			});

			await restartShortcut().action(ctx({ platform: "Android" }));

			assert.deepEqual(restarts, [
				{ projectDir: "/project", deviceIdentifiers: ["android-1"] },
			]);
		});

		it("restarts the app on every device of the session when no platform is set", async () => {
			const { restarts, ctx } = session();

			await restartShortcut().action(ctx());

			assert.deepEqual(restarts, [{ projectDir: "/project" }]);
		});

		it("says so instead of restarting everything when the platform has no session device", async () => {
			const { restarts, ctx } = session({
				descriptors: ["android-1"],
				devicesByPlatform: { Android: ["android-1"] },
			});
			const infos: string[] = [];
			const originalInfo = console.info;
			console.info = (message?: any) => void infos.push(String(message));

			try {
				await restartShortcut().action(ctx({ platform: "iOS" }));
			} finally {
				console.info = originalInfo;
			}

			assert.deepEqual(restarts, []);
			assert.include(infos.join("\n"), "no iOS device");
		});

		it("re-runs the live sync for `R`, without forcing a native rebuild", async () => {
			const { liveSyncOperations, ctx } = session();

			await restartShortcut({ full: true }).action(ctx());

			assert.deepEqual(liveSyncOperations, [
				{
					devices: [{ platform: undefined }],
					platform: undefined,
					options: { restartLiveSync: true },
				},
			]);
		});

		it("forces the native rebuild only when asked for it", async () => {
			const { liveSyncOperations, ctx } = session();

			await restartShortcut({
				forceRebuildNativeApp: true,
				platform: "iOS",
			}).action(ctx());

			assert.deepEqual(liveSyncOperations, [
				{
					devices: [{ platform: "iOS" }],
					platform: "iOS",
					options: {
						restartLiveSync: true,
						skipNativePrepare: false,
						forceRebuildNativeApp: true,
					},
				},
			]);
		});

		it("hands the restart over to a caller that brought its own", async () => {
			const { restarts, liveSyncOperations, ctx } = session();
			let replacements = 0;

			await restartShortcut({
				restart: async () => void replacements++,
			}).action(ctx());

			assert.equal(replacements, 1);
			assert.lengthOf(restarts, 0);
			assert.lengthOf(liveSyncOperations, 0);
		});
	});

	describe("findShortcut", () => {
		it("fails loudly rather than returning a description-less entry", () => {
			assert.throws(
				() => findShortcut(keyShortcuts(), "q"),
				"No key shortcut is defined for 'q'.",
			);
		});
	});

	describe("keyShortcutsEnabled", () => {
		const env = ["NS_KEY_SHORTCUTS", "CI", "JENKINS_HOME"];
		let saved: { [key: string]: string };
		let stdin: FakeStdin;
		let restoreStdin: () => void;

		beforeEach(() => {
			saved = {};
			for (const name of env) {
				saved[name] = process.env[name];
				delete process.env[name];
			}
			stdin = new FakeStdin();
			restoreStdin = swapStdin(stdin);
		});

		afterEach(() => {
			restoreStdin();
			for (const name of env) {
				if (saved[name] === undefined) {
					delete process.env[name];
				} else {
					process.env[name] = saved[name];
				}
			}
		});

		it("requires a terminal", () => {
			assert.isTrue(keyShortcutsEnabled());
			stdin.isTTY = false;
			assert.isFalse(keyShortcutsEnabled());
		});

		it("stays out of CI", () => {
			process.env.CI = "true";
			assert.isFalse(keyShortcutsEnabled());
			delete process.env.CI;

			process.env.JENKINS_HOME = "/var/jenkins";
			assert.isFalse(keyShortcutsEnabled());
		});

		it("obeys NS_KEY_SHORTCUTS in both directions", () => {
			process.env.NS_KEY_SHORTCUTS = "false";
			assert.isFalse(keyShortcutsEnabled());

			process.env.CI = "true";
			process.env.NS_KEY_SHORTCUTS = "true";
			assert.isTrue(keyShortcutsEnabled());
		});
	});

	describe("KeyShortcutService", () => {
		let stdin: FakeStdin;
		let restoreStdin: () => void;
		let service: KeyShortcutService;
		let errors: string[];
		let info: string[];
		let echoed: string[];
		let restoreConsole: () => void;
		let savedSetting: string;
		let registrations: Map<any, any>;
		let registry: KeyShortcutRegistryService;
		let restoreSend: () => void;

		beforeEach(() => {
			savedSetting = process.env.NS_KEY_SHORTCUTS;
			process.env.NS_KEY_SHORTCUTS = "true";

			// A worker thread has no IPC channel; the IPC tests need one to exist.
			const originalSend = process.send;
			if (!originalSend) {
				process.send = () => true;
			}
			restoreSend = () => {
				process.send = originalSend;
			};

			stdin = new FakeStdin();
			restoreStdin = swapStdin(stdin);

			errors = [];
			info = [];
			echoed = [];
			registrations = new Map<any, any>();
			registry = new KeyShortcutRegistryService();
			service = new KeyShortcutService(
				fakeInjector(registrations),
				<ILogger>(<any>{
					error: (message: string) => errors.push(message),
				}),
				registry,
			);
			registrations.set("keyShortcutService", service);

			const originalInfo = console.info;
			const originalLog = console.log;
			const originalWrite = process.stdout.write;
			console.info = (message?: any) => void info.push(String(message));
			console.log = () => undefined;
			(<any>process.stdout).write = (chunk: any) => {
				echoed.push(String(chunk));
				return true;
			};
			restoreConsole = () => {
				console.info = originalInfo;
				console.log = originalLog;
				(<any>process.stdout).write = originalWrite;
			};
		});

		afterEach(() => {
			service.detach();
			restoreConsole();
			restoreStdin();
			restoreSend();
			if (savedSetting === undefined) {
				delete process.env.NS_KEY_SHORTCUTS;
			} else {
				process.env.NS_KEY_SHORTCUTS = savedSetting;
			}
		});

		const press = async (key: string): Promise<void> => {
			stdin.emit("data", Buffer.from(key));
			await flush();
		};

		it("gates dispatch and help on the same `when` verdict", async () => {
			const ran: string[] = [];
			// Answers differently per position rather than per call, so the two
			// readers agree only by going through the same resolution.
			let asked = 0;
			const alternating = () => ++asked % 2 === 1;

			service.attach({
				shortcuts: [
					{
						key: "x",
						description: "AskedFirst",
						when: alternating,
						action: () => void ran.push("x"),
					},
					{
						key: "y",
						description: "AskedSecond",
						when: alternating,
						action: () => void ran.push("y"),
					},
				],
			});

			service.printHelp();
			const help = info.join("\n");

			await press("x");
			await press("y");

			assert.include(help, "AskedFirst");
			assert.notInclude(help, "AskedSecond");
			assert.deepEqual(ran, ["x"]);
			assert.deepEqual(echoed, ["y"]);
		});

		it("dispatches the later definition of a key", async () => {
			const ran: string[] = [];

			service.attach({
				shortcuts: [
					{
						key: "r",
						description: "First",
						action: () => void ran.push("first"),
					},
					{
						key: "r",
						description: "Second",
						action: () => void ran.push("second"),
					},
				],
			});

			await press("r");

			assert.deepEqual(ran, ["second"]);
		});

		it("echoes a key whose shortcut was removed", async () => {
			const ran: string[] = [];

			service.attach({
				shortcuts: [
					{
						key: "w",
						description: "Watcher",
						action: () => void ran.push("w"),
					},
					{ key: "w", description: "Watcher", action: undefined },
				],
			});

			service.printHelp();

			await press("w");

			assert.deepEqual(ran, []);
			assert.deepEqual(echoed, ["w"]);
			assert.notInclude(info.join("\n"), "Watcher");
		});

		it("runs the built-in help even when a table claims '?'", async () => {
			const ran: string[] = [];

			service.attach({
				shortcuts: [
					{
						key: "?",
						description: "Hijacked",
						action: () => void ran.push("?"),
					},
				],
			});

			await press("?");

			assert.deepEqual(ran, []);
			assert.include(info.join("\n"), "Show this help");
		});

		it("reports an action that throws instead of dying", async () => {
			service.attach({
				shortcuts: [
					{
						key: "x",
						description: "Broken",
						action: () => {
							throw new Error("boom");
						},
					},
				],
			});

			await press("x");

			assert.deepEqual(errors, ["boom"]);
		});

		it("ignores keys while an action is still running", async () => {
			const ran: string[] = [];
			let release: () => void;
			const blocked = new Promise<void>((resolve) => (release = resolve));

			service.attach({
				shortcuts: [
					{ key: "x", description: "Slow", action: () => blocked },
					{ key: "y", description: "Fast", action: () => void ran.push("y") },
				],
			});

			stdin.emit("data", Buffer.from("x"));
			await press("y");
			assert.deepEqual(ran, []);

			release();
			await flush();

			await press("y");
			assert.deepEqual(ran, ["y"]);
		});

		it("puts the terminal in raw mode and takes it back out on teardown", () => {
			assert.isTrue(service.attach({ shortcuts: [] }));
			assert.isTrue(stdin.rawMode);
			assert.equal(stdin.listenerCount("data"), 1);

			service.detach();

			assert.isFalse(stdin.rawMode);
			assert.equal(stdin.listenerCount("data"), 0);
			assert.equal(stdin.pauseCount, 1);
		});

		it("tears down when the process exits", () => {
			const before = new Set(process.listeners("exit"));
			service.attach({ shortcuts: [] });
			assert.isTrue(stdin.rawMode);

			// Invoked directly: emitting "exit" would reach the test runner too.
			const registered = process
				.listeners("exit")
				.filter((listener) => !before.has(listener));
			assert.equal(registered.length, 1);
			(<any>registered[0])();

			assert.isFalse(stdin.rawMode);
			assert.equal(stdin.listenerCount("data"), 0);
			assert.equal(
				process.listeners("exit").filter((l) => !before.has(l)).length,
				0,
			);
		});

		it("restores the terminal and re-raises the interrupt on Ctrl+C", async () => {
			const signals: string[] = [];
			const originalKill = process.kill;
			(<any>process).kill = (pid: number, signal: string): void => {
				signals.push(signal);
			};

			try {
				service.attach({ shortcuts: [] });

				await press("\u0003");

				assert.isFalse(stdin.rawMode);
				assert.deepEqual(signals, ["SIGINT"]);
			} finally {
				process.kill = originalKill;
			}
		});

		it("declines to attach when shortcuts are switched off", () => {
			process.env.NS_KEY_SHORTCUTS = "false";

			assert.isFalse(service.attach({ shortcuts: [] }));
			assert.isNull(stdin.rawMode);
			assert.equal(stdin.listenerCount("data"), 0);
		});

		it("listens over IPC when stdin is not a terminal", async () => {
			stdin.isTTY = false;
			const ran: string[] = [];
			const before = new Set(process.listeners("message"));

			assert.isTrue(
				service.attach({
					shortcuts: [
						{
							key: "r",
							description: "Restart",
							action: () => void ran.push("r"),
						},
					],
				}),
			);
			assert.isNull(stdin.rawMode);

			// Invoked directly: the test runner talks to its workers over the same
			// channel, so a synthetic "message" event must not reach it.
			const registered = process
				.listeners("message")
				.filter((listener) => !before.has(listener));
			assert.equal(registered.length, 1);
			(<any>registered[0])("r");
			await flush();

			assert.deepEqual(ran, ["r"]);
		});

		it("declines to attach without a terminal or an IPC channel", () => {
			stdin.isTTY = false;
			const before = new Set(process.listeners("message"));
			const send = process.send;
			process.send = undefined;
			let attached: boolean;
			try {
				attached = service.attach({ shortcuts: [] });
			} finally {
				process.send = send;
			}

			assert.isFalse(attached);
			assert.lengthOf(
				process.listeners("message").filter((l) => !before.has(l)),
				0,
			);
		});

		it("gives an action the injector and the caller's own context", async () => {
			interface WatchContext extends KeyContextBase {
				watching: boolean;
			}
			const toggled: string[] = [];
			registrations.set("prepareController", {
				toggleFileWatcher: () => toggled.push("toggled"),
			});

			service.attach<WatchContext>({
				context: { watching: true },
				shortcuts: [
					{
						key: "w",
						description: "Toggle the watcher",
						when: (ctx) => ctx.watching,
						action: (ctx) =>
							void ctx.injector
								.get<IPrepareController>("prepareController")
								.toggleFileWatcher(),
					},
					{
						key: "s",
						description: "Stop watching",
						when: (ctx) => !ctx.watching,
						action: () => void toggled.push("stopped"),
					},
				],
			});

			await press("w");
			await press("s");

			assert.deepEqual(toggled, ["toggled"]);
			assert.deepEqual(echoed, ["s"]);
		});

		it("re-reads the table on every keypress", async () => {
			const ran: string[] = [];
			let available = false;

			service.attach({
				shortcuts: [
					{
						key: "x",
						description: "Late arrival",
						when: () => available,
						action: () => void ran.push("x"),
					},
				],
			});

			await press("x");
			available = true;
			await press("x");

			assert.deepEqual(ran, ["x"]);
			assert.deepEqual(echoed, ["x"]);
		});

		it("takes the table it attached out of the registry when it detaches", () => {
			service.attach({
				shortcuts: [{ key: "x", description: "Attached", action: noop }],
			});
			assert.deepEqual(keysOf(registry.entries()), ["x"]);

			service.detach();

			assert.deepEqual(registry.entries(), []);
		});

		it("replaces its own table when it attaches again", () => {
			service.attach({
				shortcuts: [{ key: "x", description: "First", action: noop }],
			});
			service.attach({
				shortcuts: [{ key: "y", description: "Second", action: noop }],
			});

			assert.deepEqual(keysOf(registry.entries()), ["y"]);
		});

		it("registers nothing when it declines to attach", () => {
			process.env.NS_KEY_SHORTCUTS = "false";

			assert.isFalse(
				service.attach({
					shortcuts: [{ key: "x", description: "Declined", action: noop }],
				}),
			);

			assert.deepEqual(registry.entries(), []);
		});

		it("dispatches and lists an entry registered after the attach", async () => {
			const ran: string[] = [];
			service.attach({ shortcuts: [] });

			registry.add({
				key: "x",
				description: "Registered late",
				action: () => void ran.push("x"),
			});

			service.printHelp();
			await press("x");

			assert.deepEqual(ran, ["x"]);
			assert.include(info.join("\n"), "Registered late");
		});

		it("leaves registrations it does not own alone across an attach cycle", () => {
			const kept = registry.add({
				key: "x",
				description: "Owned elsewhere",
				action: noop,
			});

			service.attach({
				shortcuts: [{ key: "y", description: "Attached", action: noop }],
			});
			service.detach();

			assert.deepEqual(keysOf(registry.entries()), ["x"]);

			kept.dispose();
			assert.deepEqual(registry.entries(), []);
		});

		it("hints at the help key, and stays quiet without a terminal", () => {
			service.printHint();
			stdin.isTTY = false;
			service.printHint();

			assert.lengthOf(info, 1);
			assert.include(info[0], "press ? to list shortcuts");
		});

		const settle = () =>
			new Promise<void>((resolve) => setTimeout(resolve, 260));

		it("repeats the hint once a burst of syncs has settled", async () => {
			const runController = new EventEmitter();
			registrations.set("runController", runController);
			service.attach({ shortcuts: [] });

			runController.emit(RunOnDeviceEvents.runOnDeviceStarted);
			runController.emit(RunOnDeviceEvents.runOnDeviceExecuted);
			runController.emit(RunOnDeviceEvents.runOnDeviceError);
			assert.lengthOf(info, 0);

			await settle();

			assert.lengthOf(info, 1);
			assert.include(info[0], "press ? to list shortcuts");
		});

		it("stops repeating the hint once it detaches", async () => {
			const runController = new EventEmitter();
			registrations.set("runController", runController);
			service.attach({ shortcuts: [] });
			service.detach();

			runController.emit(RunOnDeviceEvents.runOnDeviceExecuted);
			await settle();

			assert.lengthOf(info, 0);
			assert.equal(
				runController.listenerCount(RunOnDeviceEvents.runOnDeviceExecuted),
				0,
			);
		});

		it("does not listen for syncs when it attaches over IPC", () => {
			const runController = new EventEmitter();
			registrations.set("runController", runController);
			stdin.isTTY = false;
			service.attach({ shortcuts: [] });

			assert.equal(
				runController.listenerCount(RunOnDeviceEvents.runOnDeviceExecuted),
				0,
			);
		});
	});
});

function noop(): void {
	// Only the presence of an action matters to these assertions.
}

function swapStdin(stdin: FakeStdin): () => void {
	const original = Object.getOwnPropertyDescriptor(process, "stdin");
	Object.defineProperty(process, "stdin", {
		value: stdin,
		configurable: true,
	});

	return () => Object.defineProperty(process, "stdin", original);
}
