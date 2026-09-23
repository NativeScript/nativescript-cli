import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Yok } from "../lib/common/yok";
import { IInjector } from "../lib/common/definitions/yok";
import { IHooksService } from "../lib/common/declarations";
import { Injector, runInInjectionContext } from "../lib/common/di";
import {
	currentInvocationInjector,
	openInvocation,
	runInInvocation,
} from "../lib/common/invocations";
import { defineCommand } from "../lib/common/define-command";
import { createCommandFromDefinition } from "../lib/common/services/command-definition-adapter";
import { HooksService } from "../lib/common/services/hooks-service";
import { ErrorsStub, LoggerStub } from "./stubs";

const openStack = (): Injector[] => {
	// Creates the process-wide slot if nothing has touched it yet.
	currentInvocationInjector();
	return (<any>globalThis)[Symbol.for("nativescript:cli:invocations")].open;
};

// The record is process-wide; every test starts from an empty stack so the
// "first entry stays open" rule applies to the test's own first open.
const resetOpenStack = (): void => {
	openStack().length = 0;
};

const tick = (): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, 1));

describe("invocations: record and lookup", () => {
	beforeEach(resetOpenStack);

	it("returns null with nothing open and no context", () => {
		assert.isNull(currentInvocationInjector());
	});

	it("prefers the injection context, then the async store, then the stack top", () => {
		const opened = new Injector();
		const stored = new Injector();
		const contextual = new Injector();
		openInvocation(opened);

		assert.strictEqual(currentInvocationInjector(), opened);
		runInInvocation(stored, () => {
			assert.strictEqual(currentInvocationInjector(), stored);
			runInInjectionContext(contextual, () => {
				assert.strictEqual(currentInvocationInjector(), contextual);
			});
			assert.strictEqual(currentInvocationInjector(), stored);
		});
		assert.strictEqual(currentInvocationInjector(), opened);
	});

	it("tracks the innermost open invocation through nested open and close", () => {
		const first = new Injector();
		const second = new Injector();
		const third = new Injector();
		openInvocation(first);
		const closeSecond = openInvocation(second);
		const closeThird = openInvocation(third);

		assert.strictEqual(currentInvocationInjector(), third);
		closeThird();
		assert.strictEqual(currentInvocationInjector(), second);
		closeSecond();
		assert.strictEqual(currentInvocationInjector(), first);
		assert.deepEqual(openStack(), [first]);
	});

	it("closes an entry opened out of order without disturbing the others", () => {
		const first = new Injector();
		const second = new Injector();
		const third = new Injector();
		openInvocation(first);
		const closeSecond = openInvocation(second);
		openInvocation(third);

		closeSecond();

		assert.deepEqual(openStack(), [first, third]);
	});

	it("never closes the first invocation of the process", () => {
		const first = new Injector();
		const closeFirst = openInvocation(first);

		closeFirst();

		assert.deepEqual(openStack(), [first]);
		assert.strictEqual(currentInvocationInjector(), first);
	});

	it("treats a second close of the same entry as a no-op", () => {
		const first = new Injector();
		const second = new Injector();
		const third = new Injector();
		openInvocation(first);
		const closeSecond = openInvocation(second);
		openInvocation(third);

		closeSecond();
		closeSecond();

		assert.deepEqual(openStack(), [first, third]);
	});

	it("keeps the async store across awaits inside runInInvocation only", async () => {
		const stored = new Injector();

		const seen = await runInInvocation(stored, async () => {
			await tick();
			const afterAwait = currentInvocationInjector();
			const inTimer = await new Promise<Injector | null>((resolve) =>
				setTimeout(() => resolve(currentInvocationInjector()), 1),
			);
			return { afterAwait, inTimer };
		});

		assert.strictEqual(seen.afterAwait, stored);
		assert.strictEqual(seen.inTimer, stored);
		assert.isNull(currentInvocationInjector());
	});
});

const createCommandInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("options", {});
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", {
		failWithHelp: (message: string) => {
			throw new Error(message);
		},
	});
	return testInjector;
};

describe("invocations: command adapter", () => {
	beforeEach(resetOpenStack);

	it("keeps the invocation injector current across awaits and detached callbacks in run", async () => {
		const testInjector = createCommandInjector();
		const seen: any = {};

		const command = createCommandFromDefinition(
			defineCommand({
				name: "invtest-als",
				run: async (ctx) => {
					seen.injector = ctx.injector;
					await tick();
					seen.afterAwait = currentInvocationInjector();
					seen.inTimer = await new Promise((resolve) =>
						setTimeout(() => resolve(currentInvocationInjector()), 1),
					);
				},
			}),
			testInjector,
		);

		await command.execute([]);

		assert.instanceOf(seen.injector, Injector);
		assert.strictEqual(seen.afterAwait, seen.injector);
		assert.strictEqual(seen.inTimer, seen.injector);
	});

	it("closes a nested invocation when its execute settles and keeps the first one open", async () => {
		const testInjector = createCommandInjector();
		const seen: any = {};

		const inner = createCommandFromDefinition(
			defineCommand({
				name: "invtest-inner",
				run: (ctx) => {
					seen.inner = ctx.injector;
					seen.stackDuringInner = openStack().slice();
				},
			}),
			testInjector,
		);
		const outer = createCommandFromDefinition(
			defineCommand({
				name: "invtest-outer",
				run: async (ctx) => {
					seen.outer = ctx.injector;
					await inner.execute([]);
					seen.stackAfterInner = openStack().slice();
					seen.currentAfterInner = currentInvocationInjector();
				},
			}),
			testInjector,
		);

		await outer.execute([]);

		assert.deepEqual(seen.stackDuringInner, [seen.outer, seen.inner]);
		assert.deepEqual(seen.stackAfterInner, [seen.outer]);
		assert.strictEqual(seen.currentAfterInner, seen.outer);
		assert.deepEqual(openStack(), [seen.outer]);
	});

	it("closes the invocation when canExecute refuses", async () => {
		const testInjector = createCommandInjector();
		openInvocation(new Injector());
		const baseline = openStack().slice();

		const command = createCommandFromDefinition(
			defineCommand({
				name: "invtest-refused",
				canExecute: () => false,
				run: (): void => undefined,
			}),
			testInjector,
		);

		assert.isFalse(await command.canExecute([]));
		assert.deepEqual(openStack(), baseline);
	});

	it("closes the invocation when canExecute throws", async () => {
		const testInjector = createCommandInjector();
		openInvocation(new Injector());
		const baseline = openStack().slice();

		const command = createCommandFromDefinition(
			defineCommand({
				name: "invtest-throws",
				canExecute: () => {
					throw new Error("invtest refusal");
				},
				run: (): void => undefined,
			}),
			testInjector,
		);

		let error: Error;
		try {
			await command.canExecute([]);
		} catch (err) {
			error = err;
		}
		assert.match(error && error.message, /invtest refusal/);
		assert.deepEqual(openStack(), baseline);
	});
});

// Hook fixtures load the API through the published entry point, as a real
// hook does.
const apiPath = require.resolve("../lib/contracts");

const createHooksInjector = (projectDir: string): IInjector => {
	const testInjector = new Yok();
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("fs", {
		exists: (p: string) => fs.existsSync(p),
		getFsStats: (p: string) => fs.statSync(p),
		readDirectory: (p: string) => fs.readdirSync(p),
		readText: (p: string) => fs.readFileSync(p, "utf8"),
	});
	testInjector.register("childProcess", {});
	testInjector.register("config", { DISABLE_HOOKS: false });
	testInjector.register("staticConfig", {
		CLIENT_NAME: "tns",
		version: "0.0.0",
	});
	testInjector.register("projectHelper", { projectDir });
	testInjector.register("options", { hooks: true });
	testInjector.register("performanceService", {
		now: () => 0,
		processExecutionData: () => {
			/* not measured here */
		},
	});
	testInjector.register("projectConfigService", {
		getValue: (_key: string, defaultValue: any) => defaultValue,
	});
	testInjector.register("projectData", { fromContainer: true });
	testInjector.register("hooksService", HooksService);
	return testInjector;
};

describe("invocations: hooks", () => {
	let projectDir: string;
	let testInjector: IInjector;
	let capture: any;

	const hooksService = (): IHooksService =>
		testInjector.resolve("hooksService");

	const writeHook = (hookName: string, source: string): void => {
		const hooksDir = path.join(projectDir, "hooks");
		fs.mkdirSync(hooksDir, { recursive: true });
		fs.writeFileSync(path.join(hooksDir, `${hookName}.js`), source);
	};

	beforeEach(() => {
		resetOpenStack();
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-invocations-"));
		testInjector = createHooksInjector(projectDir);
		capture = (<any>global).__invHookCapture = {};
	});

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
		delete (<any>global).__invHookCapture;
	});

	it("resolves a plain hook's $-parameters against the running invocation", async () => {
		writeHook(
			"before-invcase1",
			`module.exports = function ($invTestHookThing) {
				global.__invHookCapture.thing = $invTestHookThing;
			};`,
		);
		testInjector.register("invTestHookThing", { from: "root" });
		const invocation = testInjector.createChild(
			[{ provide: "invTestHookThing", useValue: { from: "invocation" } }],
			{ scope: "invocation" },
		);

		await runInInvocation(invocation, () =>
			hooksService().executeBeforeHooks("invcase1"),
		);

		assert.deepEqual(capture.thing, { from: "invocation" });
	});

	it("gives a plain hook an invocation-scoped service by name", async () => {
		writeHook(
			"before-invcase2",
			`module.exports = function ($invTestScopedService) {
				global.__invHookCapture.service = $invTestScopedService;
			};`,
		);
		testInjector.register({
			provide: "invTestScopedService",
			providedIn: "invocation",
			useFactory: () => ({ scoped: true }),
		});
		const invocation = testInjector.createChild([], { scope: "invocation" });

		await runInInvocation(invocation, () =>
			hooksService().executeBeforeHooks("invcase2"),
		);

		assert.strictEqual(capture.service, invocation.get("invTestScopedService"));
	});

	it("runs a defineHook definition in the running invocation's injection context", async () => {
		writeHook(
			"before-invcase3",
			`const { defineHook, inject, Injector } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-invcase3", () => {
				global.__invHookCapture.container = inject(Injector);
				global.__invHookCapture.thing = inject("invTestHookThing");
			});`,
		);
		const invocation = testInjector.createChild(
			[{ provide: "invTestHookThing", useValue: { from: "invocation" } }],
			{ scope: "invocation" },
		);

		await runInInvocation(invocation, () =>
			hooksService().executeBeforeHooks("invcase3"),
		);

		assert.strictEqual(capture.container, invocation);
		assert.deepEqual(capture.thing, { from: "invocation" });
	});

	it("falls back to the root injector outside any invocation", async () => {
		writeHook(
			"before-invcase4",
			`module.exports = function ($invTestHookThing) {
				global.__invHookCapture.thing = $invTestHookThing;
			};`,
		);
		testInjector.register("invTestHookThing", { from: "root" });

		await hooksService().executeBeforeHooks("invcase4");

		assert.deepEqual(capture.thing, { from: "root" });
	});
});
