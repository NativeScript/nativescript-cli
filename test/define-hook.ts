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

	it("logs a warning and continues when the handler aborts with asWarning", async () => {
		writeHook(
			projectDir,
			"before-case7",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case7", async (ctx) => {
				ctx.abort("soft-abort", { asWarning: true });
			});`,
		);

		await hooksService().executeBeforeHooks("case7");

		assert.include(logger().warnOutput, "soft-abort");
	});

	it("fails the command when the handler aborts without asWarning", async () => {
		writeHook(
			projectDir,
			"before-case8",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-case8", async (ctx) => {
				ctx.abort("hard-abort");
			});`,
		);

		await assert.isRejected(
			hooksService().executeBeforeHooks("case8"),
			/hard-abort/,
		);
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

	it("runs a definition whose name differs from the hook point and traces the mismatch", async () => {
		writeHook(
			projectDir,
			"before-case11",
			`const { defineHook } = require(${JSON.stringify(apiPath)});
			module.exports = defineHook("before-something-else", () => {
				global.__hookCapture.ran = true;
			});`,
		);

		await hooksService().executeBeforeHooks("case11");

		assert.isTrue(capture.ran);
		assert.include(logger().traceOutput, `defines "before-something-else"`);
		assert.include(logger().traceOutput, `"before-case11" hook point`);
	});
});
