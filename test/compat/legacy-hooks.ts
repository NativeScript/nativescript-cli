import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Yok, getInjector, setGlobalInjector } from "../../lib/common/yok";
import { HooksService } from "../../lib/common/services/hooks-service";
import { hook } from "../../lib/common/helpers";
import { IInjector } from "../../lib/common/definitions/yok";
import { IHooksService } from "../../lib/common/declarations";
import { LoggerStub, ErrorsStub } from "../stubs";

// Pins the published third-party hook contract: hooks are plain JS files whose
// exported function is resolved by its own parameter names (`$logger`,
// `hookArgs`, ...). Payload shapes and influence channels covered here are the
// compatibility bar for any DI changes.

function createTestInjector(projectDir: string): IInjector {
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
}

function writeHook(projectDir: string, hookName: string, source: string): void {
	const hooksDir = path.join(projectDir, "hooks");
	fs.mkdirSync(hooksDir, { recursive: true });
	fs.writeFileSync(path.join(hooksDir, `${hookName}.js`), source);
}

describe("legacy hook contract", () => {
	let projectDir: string;
	let testInjector: IInjector;
	let capture: any;

	const hooksService = (): IHooksService =>
		testInjector.resolve("hooksService");
	const logger = (): LoggerStub => testInjector.resolve("logger");

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-compat-hooks-"));
		testInjector = createTestInjector(projectDir);
		capture = (<any>global).__hookCapture = {};
	});

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
		delete (<any>global).__hookCapture;
	});

	it("injects services by $-prefixed parameter name and passes hookArgs by identity", async () => {
		writeHook(
			projectDir,
			"before-case1",
			`module.exports = function ($logger, $injector, hookArgs) {
				global.__hookCapture.logger = $logger;
				global.__hookCapture.injector = $injector;
				global.__hookCapture.hookArgs = hookArgs;
			};`,
		);

		const payload = { anything: 1 };
		await hooksService().executeBeforeHooks("case1", { hookArgs: payload });

		assert.strictEqual(capture.logger, testInjector.resolve("logger"));
		assert.strictEqual(capture.injector, testInjector);
		assert.strictEqual(capture.hookArgs, payload);
		assert.include(logger().traceOutput, "hooks.param-name-signature");
	});

	it("derives the hook name from the pre-| part of hierarchical command names", async () => {
		writeHook(
			projectDir,
			"before-case2",
			`module.exports = function (hookArgs) { global.__hookCapture.ran = true; };`,
		);

		await hooksService().executeBeforeHooks("case2|android", {
			hookArgs: {},
		});

		assert.isTrue(capture.ran);
	});

	it("promotes hookArgs.projectData so it shadows the container's projectData under both spellings", async () => {
		writeHook(
			projectDir,
			"after-case3",
			`module.exports = function ($projectData, projectData) {
				global.__hookCapture.dollar = $projectData;
				global.__hookCapture.plain = projectData;
			};`,
		);

		const payloadProjectData = { projectDir, fromPayload: true };
		await hooksService().executeAfterHooks("case3", {
			hookArgs: { projectData: payloadProjectData },
		});

		assert.strictEqual(capture.dollar, payloadProjectData);
		assert.strictEqual(capture.plain, payloadProjectData);
	});

	it("lets a hook mutate the payload in a way the caller observes (before-build-task-args channel)", async () => {
		writeHook(
			projectDir,
			"before-build-task-args",
			`module.exports = function (hookArgs) { hookArgs.args.push("--offline"); };`,
		);

		const args = ["assembleDebug"];
		await hooksService().executeBeforeHooks("build-task-args", {
			hookArgs: { args },
		});

		assert.deepEqual(args, ["assembleDebug", "--offline"]);
		// A hookArgs-only signature is the recommended pattern and must not be
		// reported as param-name injection.
		assert.notInclude(logger().traceOutput, "hooks.param-name-signature");
	});

	it("treats a rejection carrying stopExecution + errorAsWarning as a warning, not a failure", async () => {
		writeHook(
			projectDir,
			"before-case5",
			`module.exports = async function () {
				const err = new Error("abort-as-warning");
				err.stopExecution = false;
				err.errorAsWarning = true;
				throw err;
			};`,
		);

		await hooksService().executeBeforeHooks("case5");

		assert.include(logger().warnOutput, "abort-as-warning");
	});

	it("fails command execution when a hook rejects without errorAsWarning", async () => {
		writeHook(
			projectDir,
			"before-case6",
			`module.exports = async function () { throw new Error("hard-abort"); };`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case6"),
			/hard-abort/,
		);
	});

	it("runs hooks with no payload at all (every command name is a hook point)", async () => {
		writeHook(
			projectDir,
			"before-case7",
			`module.exports = function ($logger) { global.__hookCapture.ran = true; };`,
		);

		await hooksService().executeBeforeHooks("case7");

		assert.isTrue(capture.ran);
	});

	it("skips (with a warning) a hook whose parameters name unwrapped payload keys", async () => {
		// after-watchAction-style payloads pass keys at the top level with no
		// hookArgs wrapper. validateHookArguments only consults the container, so
		// a hook naming such a key is skipped as invalid — today's behavior, which
		// the migration must preserve exactly.
		writeHook(
			projectDir,
			"after-case8",
			`module.exports = function (liveSyncResultInfo) { global.__hookCapture.ran = true; };`,
		);

		await hooksService().executeAfterHooks("case8", {
			liveSyncResultInfo: { fake: true },
		});

		assert.isUndefined(capture.ran);
		assert.include(logger().warnOutput, "invalid arguments");
	});

	it("folds a function returned by a before-hook into a middleware chain around the @hook-decorated method", async () => {
		writeHook(
			projectDir,
			"before-case9",
			`module.exports = function (hookArgs) {
				return function (args, originalMethod) {
					global.__hookCapture.middlewareArgs = args.slice();
					return originalMethod.apply(null, args).then(function (result) {
						return "wrapped(" + result + ")";
					});
				};
			};`,
		);

		class Subject {
			constructor(public $hooksService: IHooksService) {}

			@hook("case9")
			async doWork(input: string): Promise<string> {
				(<any>global).__hookCapture.originalRan = true;
				return "original:" + input;
			}
		}

		const subject = testInjector.resolve(Subject);
		const result = await subject.doWork("x");

		assert.equal(result, "wrapped(original:x)");
		assert.isTrue(capture.originalRan);
		assert.deepEqual(capture.middlewareArgs, ["x"]);
	});

	it("lets a middleware short-circuit so the original method never runs", async () => {
		writeHook(
			projectDir,
			"before-case10",
			`module.exports = function () {
				return function (args, originalMethod) {
					return "short-circuited";
				};
			};`,
		);

		class Subject {
			constructor(public $hooksService: IHooksService) {}

			@hook("case10")
			async doWork(): Promise<string> {
				(<any>global).__hookCapture.originalRan = true;
				return "original";
			}
		}

		const subject = testInjector.resolve(Subject);
		const result = await subject.doWork();

		assert.equal(result, "short-circuited");
		assert.isUndefined(capture.originalRan);
	});

	it("runs hook bodies in an injection context, so inject() resolves services", async () => {
		const diPath = require.resolve("../../lib/common/di");
		writeHook(
			projectDir,
			"before-case-inject",
			`const { inject, Injector } = require(${JSON.stringify(diPath)});
			module.exports = function (hookArgs) {
				global.__hookCapture.logger = inject("logger");
				global.__hookCapture.container = inject(Injector);
				global.__hookCapture.hookArgs = hookArgs;
			};`,
		);

		const payload = { sample: true };
		await hooksService().executeBeforeHooks("case-inject", {
			hookArgs: payload,
		});

		assert.strictEqual(capture.logger, testInjector.resolve("logger"));
		assert.strictEqual(capture.container, testInjector.di);
		assert.strictEqual(capture.hookArgs, payload);
	});

	it("@hook falls back to the global injector when the class has neither $hooksService nor $injector", async () => {
		writeHook(
			projectDir,
			"before-case11",
			`module.exports = function () { global.__hookCapture.ran = true; };`,
		);

		class Subject {
			@hook("case11")
			async doWork(): Promise<string> {
				return "ok";
			}
		}

		const previousInjector = getInjector();
		setGlobalInjector(testInjector);
		try {
			const result = await new Subject().doWork();
			assert.equal(result, "ok");
			assert.isTrue(capture.ran);
		} finally {
			setGlobalInjector(previousInjector);
		}
	});

	it("@hook prefers the instance's $injector over the global injector", async () => {
		writeHook(
			projectDir,
			"before-case12",
			`module.exports = function () { global.__hookCapture.ran = true; };`,
		);

		class Subject {
			public $injector = testInjector;

			@hook("case12")
			async doWork(): Promise<string> {
				return "ok";
			}
		}

		const previousInjector = getInjector();
		setGlobalInjector(<any>{
			resolve: () => {
				throw new Error("the process-wide injector must be the last resort");
			},
		});
		try {
			const result = await new Subject().doWork();
			assert.equal(result, "ok");
			assert.isTrue(capture.ran);
		} finally {
			setGlobalInjector(previousInjector);
		}
	});
});
