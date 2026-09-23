import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Yok } from "../lib/common/yok";
import { HooksService } from "../lib/common/services/hooks-service";
import { hook } from "../lib/common/helpers";
import { IInjector } from "../lib/common/definitions/yok";
import { IHooksService } from "../lib/common/declarations";
import { LoggerStub, ErrorsStub } from "./stubs";
import { defineHook, isHookDefinition } from "../lib/common/define-hook";

// Hook fixtures load the API the way a real hook does — through the published
// `nativescript/contracts` entry point — so the marker symbol, the context
// shape and the hooks-service integration are exercised end to end.
const apiPath = require.resolve("../lib/contracts");

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

function writeHook(
	projectDir: string,
	hookName: string,
	source: string,
	extension = ".js",
): string {
	const hooksDir = path.join(projectDir, "hooks");
	fs.mkdirSync(hooksDir, { recursive: true });
	const fullPath = path.join(hooksDir, `${hookName}${extension}`);
	fs.writeFileSync(fullPath, source);
	return fullPath;
}

function writeHookInDirectory(
	projectDir: string,
	hookName: string,
	fileName: string,
	source: string,
): string {
	const hooksDir = path.join(projectDir, "hooks", hookName);
	fs.mkdirSync(hooksDir, { recursive: true });
	const fullPath = path.join(hooksDir, fileName);
	fs.writeFileSync(fullPath, source);
	return fullPath;
}

describe("defineHook", () => {
	let projectDir: string;
	let testInjector: IInjector;
	let capture: any;

	const hooksService = (): IHooksService =>
		testInjector.resolve("hooksService");
	const logger = (): LoggerStub => testInjector.resolve("logger");

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-define-hook-"));
		testInjector = createTestInjector(projectDir);
		capture = (<any>global).__hookCapture = {};
	});

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
		delete (<any>global).__hookCapture;
	});

	it("passes the hookArgs value as the payload, by identity and mutable in place", async () => {
		writeHook(
			projectDir,
			"before-case1",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case1", async (ctx) => {
				global.__hookCapture.payload = ctx.payload;
				ctx.payload.args.push("--offline");
			});`,
		);

		const args = ["assembleDebug"];
		const payload = { args };
		await hooksService().executeBeforeHooks("case1", { hookArgs: payload });

		assert.strictEqual(capture.payload, payload);
		assert.deepEqual(args, ["assembleDebug", "--offline"]);
	});

	it("passes the top-level bag as the payload when there is no hookArgs wrapper", async () => {
		writeHook(
			projectDir,
			"after-case2",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("after-case2", (ctx) => {
				global.__hookCapture.payload = ctx.payload;
			});`,
		);

		const liveSyncResultInfo = { fake: true };
		await hooksService().executeAfterHooks("case2", { liveSyncResultInfo });

		assert.strictEqual(capture.payload.liveSyncResultInfo, liveSyncResultInfo);
	});

	it("leaves the payload undefined for a hook point with no arguments", async () => {
		writeHook(
			projectDir,
			"before-case3",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case3", (ctx) => {
				global.__hookCapture.ran = true;
				global.__hookCapture.payload = ctx.payload;
			});`,
		);

		await hooksService().executeBeforeHooks("case3");

		assert.isTrue(capture.ran);
		assert.isUndefined(capture.payload);
	});

	it("runs the handler in an injection context, so inject() resolves by token and by name", async () => {
		writeHook(
			projectDir,
			"before-case4",
			`const { defineHook, inject, Injector } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case4", async (ctx) => {
				global.__hookCapture.container = inject(Injector);
				global.__hookCapture.logger = inject("logger");
			});`,
		);

		await hooksService().executeBeforeHooks("case4");

		assert.strictEqual(capture.container, testInjector);
		assert.strictEqual(capture.logger, testInjector.resolve("logger"));
	});

	it("folds a wrap() middleware into the chain around the @hook-decorated method", async () => {
		writeHook(
			projectDir,
			"before-case5",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case5", (ctx) => {
				ctx.wrap(function (args, next) {
					global.__hookCapture.middlewareArgs = args.slice();
					return next.apply(null, args).then(function (result) {
						return "wrapped(" + result + ")";
					});
				});
			});`,
		);

		class Subject {
			constructor(public $hooksService: IHooksService) {}

			@hook("case5")
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

	it("lets a wrap() middleware short-circuit the decorated method", async () => {
		writeHook(
			projectDir,
			"before-case6",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case6", (ctx) => {
				ctx.wrap(function () {
					return "short-circuited";
				});
			});`,
		);

		class Subject {
			constructor(public $hooksService: IHooksService) {}

			@hook("case6")
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

	it("warns and continues the command when the handler skips, stopping the handler", async () => {
		writeHook(
			projectDir,
			"before-case7",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case7", async (ctx) => {
				ctx.skip("soft-skip");
				global.__hookCapture.afterSkip = true;
			});`,
		);

		await hooksService().executeBeforeHooks("case7");

		assert.include(logger().warnOutput, "soft-skip");
		assert.isUndefined(capture.afterSkip);
	});

	it("fails the command when the handler fails, stopping the handler", async () => {
		writeHook(
			projectDir,
			"before-case8",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case8", async (ctx) => {
				ctx.fail("hard-fail");
				global.__hookCapture.afterFail = true;
			});`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case8"),
			/hard-fail/,
		);
		assert.isUndefined(capture.afterFail);
	});

	it("keeps a legacy param-name hook on the old path, and never reports a definition hook", async () => {
		const legacyPath = writeHookInDirectory(
			projectDir,
			"before-case9",
			"legacy.js",
			`module.exports = function ($logger) {
				global.__hookCapture.legacyRan = true;
			};`,
		);
		const definitionPath = writeHookInDirectory(
			projectDir,
			"before-case9",
			"modern.js",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case9", () => {
				global.__hookCapture.definitionRan = true;
			});`,
		);

		await hooksService().executeBeforeHooks("case9");

		assert.isTrue(capture.legacyRan);
		assert.isTrue(capture.definitionRan);

		const deprecationReports = logger()
			.traceOutput.split("\n")
			.filter((line) => line.indexOf("hooks.param-name-signature") !== -1);
		assert.isTrue(
			deprecationReports.some((line) => line.indexOf(legacyPath) !== -1),
		);
		assert.isFalse(
			deprecationReports.some((line) => line.indexOf(definitionPath) !== -1),
		);
	});

	it("recognizes a definition default-exported from an .mjs hook", async () => {
		writeHook(
			projectDir,
			"before-case10",
			`import { createRequire } from "module";
			const require = createRequire(import.meta.url);
			const { defineHook } = require(${JSON.stringify(apiPath)});
			export default defineHook("before-case10", (ctx) => {
				global.__hookCapture.payload = ctx.payload;
			});`,
			".mjs",
		);

		const payload = { fromMjs: true };
		await hooksService().executeBeforeHooks("case10", { hookArgs: payload });

		assert.strictEqual(capture.payload, payload);
	});

	it("skips a definition whose name differs from the hook point, with a warning", async () => {
		writeHook(
			projectDir,
			"before-case11",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-something-else", () => {
				global.__hookCapture.ran = true;
			});`,
		);

		await hooksService().executeBeforeHooks("case11");

		assert.isUndefined(capture.ran);
		assert.include(logger().warnOutput, `defines the "before-something-else"`);
		assert.include(logger().warnOutput, `"before-case11" hook point`);
	});

	it("accepts the object bag form", async () => {
		writeHook(
			projectDir,
			"before-case12",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook({
				name: "before-case12",
				run: (ctx) => {
					global.__hookCapture.payload = ctx.payload;
				},
			});`,
		);

		const payload = { fromBag: true };
		await hooksService().executeBeforeHooks("case12", { hookArgs: payload });

		assert.strictEqual(capture.payload, payload);
	});

	it("rejects a wrap() at a hook point that consumes no middlewares", async () => {
		writeHook(
			projectDir,
			"before-case13",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case13", (ctx) => {
				ctx.wrap((args, next) => next(...args));
			});`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case13"),
			/ctx\.wrap\(\) is not available at the "before-case13" hook point/,
		);
	});

	it("rejects a wrap() from an after-hook", async () => {
		writeHook(
			projectDir,
			"after-case14",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("after-case14", (ctx) => {
				ctx.wrap((args, next) => next(...args));
			});`,
		);

		await assert.isRejected(
			hooksService().executeAfterHooks("case14"),
			/ctx\.wrap\(\) is not available at the "after-case14" hook point/,
		);
	});

	it("defaults the fail() message instead of failing with Error(undefined)", async () => {
		writeHook(
			projectDir,
			"before-case15",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case15", (ctx) => {
				ctx.fail();
			});`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case15"),
			/The "before-case15" hook called ctx\.fail\(\) without a message\./,
		);
	});

	it("defaults the skip() message", async () => {
		writeHook(
			projectDir,
			"before-case18",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case18", (ctx) => {
				ctx.skip();
			});`,
		);

		await hooksService().executeBeforeHooks("case18");

		assert.include(
			logger().warnOutput,
			'The "before-case18" hook called ctx.skip() without a message.',
		);
	});

	it("warns when a definition returns a function instead of calling ctx.wrap()", async () => {
		writeHook(
			projectDir,
			"before-case16",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case16", () => {
				return () => "legacy middleware";
			});`,
		);

		await hooksService().executeBeforeHooks("case16");

		assert.include(logger().warnOutput, "returned a function");
	});

	it("rejects an array export, naming the file", async () => {
		const fullPath = writeHook(
			projectDir,
			"before-case17",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = [defineHook("before-case17", () => {})];`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case17"),
			new RegExp(
				`${fullPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} exports an array`,
			),
		);
	});
});

describe("defineHook validation", () => {
	// The negative cases are exactly the ones the types reject, so they need an
	// untyped view of the same function.
	const defineHookUnsafe: any = defineHook;

	it("carries the payload generic through to ctx.payload", () => {
		const definition = defineHook<{ args: string[] }>(
			"before-build-task-args",
			(ctx) => {
				// Compile-time: `payload` is `{ args: string[] } | undefined`, so it
				// needs narrowing before use.
				assert.isUndefined(ctx.payload?.args);
			},
		);

		assert.isTrue(isHookDefinition(definition));
	});

	it("rejects a bag with an unknown field, naming it and the accepted forms", () => {
		assert.throws(
			() => defineHookUnsafe({ name: "before-prepare", handler: () => {} }),
			/unknown field "handler".*Supported fields: "name", "run".*Accepted forms/s,
		);
	});

	it("rejects a bag with no run", () => {
		assert.throws(
			() => defineHookUnsafe({ name: "before-prepare" }),
			/"before-prepare".*requires "run" to be a function/,
		);
	});

	it("rejects a bag with no name", () => {
		assert.throws(
			() => defineHookUnsafe({ run: () => {} }),
			/requires a non-empty "name"/,
		);
	});

	it("rejects the positional form without a handler function", () => {
		assert.throws(
			() => defineHookUnsafe("before-prepare"),
			/"before-prepare".*requires a handler function as its second argument/,
		);
	});

	it("rejects a non-object, non-string argument", () => {
		assert.throws(
			() => defineHookUnsafe(undefined),
			/called with an unsupported argument/,
		);
	});

	it("keeps the marker through a spread, so derived definitions stay recognizable", () => {
		const definition = defineHook("before-prepare", () => {});
		const derived = { ...definition, name: "before-build" };

		assert.isTrue(isHookDefinition(definition));
		assert.isTrue(isHookDefinition(derived));
		assert.equal(derived.name, "before-build");
	});

	it("does not recognize a hand-rolled object", () => {
		assert.isFalse(isHookDefinition({ name: "before-prepare", run: () => {} }));
	});
});
