import * as fs from "fs";
import * as path from "path";
import { assert, expect } from "chai";
import { Yok } from "../../../yok";
import { IInjector } from "../../../definitions/yok";
import {
	ErrorsStub,
	LoggerStub,
	PerformanceService,
	ProjectConfigServiceStub,
	ProjectHelperStub,
} from "../../../../../test/stubs";
import * as FileSystemLib from "../../../file-system";
import * as ChildProcessLib from "../../../child-process";
import { IHooksService } from "../../../declarations";
import { HooksService } from "../../../services/hooks-service";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";

function createTestInjector(opts?: { projectDir?: string }): IInjector {
	const testInjector = new Yok();
	testInjector.register("fs", FileSystemLib.FileSystem);
	testInjector.register("childProcess", ChildProcessLib.ChildProcess);
	testInjector.register("injector", testInjector);
	testInjector.register("config", {});
	testInjector.register("logger", LoggerStub);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("options", { hooks: true });
	testInjector.register("staticConfig", {
		CLIENT_NAME: "tns",
		VERSION: "1.0.0",
	});
	testInjector.register("projectConfigService", ProjectConfigServiceStub);
	testInjector.register(
		"projectHelper",
		new ProjectHelperStub("", opts && opts.projectDir),
	);
	testInjector.register("performanceService", PerformanceService);
	testInjector.register("hooksService", HooksService);

	return testInjector;
}

describe("hooks-service", () => {
	let service: IHooksService;

	it("should run hooks from hooks folder", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`module.exports = function ($logger, hookArgs) {`,
			`	return new Promise(function (resolve, reject) {`,
			`		$logger.info("after-prepare hook is running");`,
			`		resolve();`,
			`	});`,
			`};`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/hook.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		assert.equal(
			testInjector.resolve("$logger").output,
			"after-prepare hook is running\n",
		);
	});

	it("should run custom hooks from nativescript config", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`module.exports = function ($logger, hookArgs) {`,
			`	return new Promise(function (resolve, reject) {`,
			`		$logger.info("custom hook is running");`,
			`		resolve();`,
			`	});`,
			`};`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "scripts"));
		fs.writeFileSync(path.join(projectPath, "scripts/custom-hook.js"), script);

		testInjector.register(
			"projectConfigService",
			ProjectConfigServiceStub.initWithConfig({
				hooks: [{ type: "before-prepare", script: "scripts/custom-hook.js" }],
			}),
		);

		service = testInjector.resolve("$hooksService");

		await service.executeBeforeHooks("prepare", { hookArgs: {} });

		assert.equal(
			testInjector.resolve("$logger").output,
			"custom hook is running\n",
		);
	});

	it("skip when missing hook args", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`module.exports = function ($logger, $projectData, hookArgs) {`,
			`	return new Promise(function (resolve, reject) {`,
			`		$logger.info("after-prepare hook is running");`,
			`		resolve();`,
			`	});`,
			`};`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/hook.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		expect(testInjector.resolve("$logger").warnOutput).to.have.string(
			"invalid arguments",
			"$projectData should be missing",
		);
	});

	it("should run hooks using syntax newer than ES2017", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`class Message {`,
			`	text = "after-prepare hook is running";`,
			`}`,
			`module.exports = function ($logger, hookArgs) {`,
			`	const message = new Message();`,
			`	$logger.info(message?.text ?? "fallback");`,
			`};`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/hook.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		assert.equal(
			testInjector.resolve("$logger").output,
			"after-prepare hook is running\n",
		);
	});

	it("should run hooks transpiled from a default export", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`"use strict";`,
			`Object.defineProperty(exports, "__esModule", { value: true });`,
			`exports.default = function ($logger, hookArgs) {`,
			`	$logger.info("after-prepare hook is running");`,
			`};`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/hook.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		assert.equal(
			testInjector.resolve("$logger").output,
			"after-prepare hook is running\n",
		);
	});

	it("should not run in-process hooks that do not export a function", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [`module.exports = { name: "not-a-hook" };`].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/hook.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		expect(testInjector.resolve("$logger").warnOutput).to.have.string(
			"does not export a function",
		);
	});

	describe("in-process detection", () => {
		const shouldExecuteInProcess = (source: string): boolean => {
			const testInjector = createTestInjector();
			const hooksService = testInjector.resolve("$hooksService");
			return (<any>hooksService).shouldExecuteInProcess(source);
		};

		it("detects module.exports assignments alongside modern syntax", () => {
			assert.isTrue(
				shouldExecuteInProcess(
					[
						`class Message { text = "hi"; }`,
						`module.exports = function ($logger) {`,
						`	$logger.info(new Message()?.text ?? "fallback");`,
						`};`,
					].join("\n"),
				),
			);
		});

		it("detects exports.default assignments", () => {
			assert.isTrue(
				shouldExecuteInProcess(
					[
						`"use strict";`,
						`Object.defineProperty(exports, "__esModule", { value: true });`,
						`exports.default = function ($logger) {};`,
					].join("\n"),
				),
			);
		});

		it("ignores scripts without an export assignment", () => {
			assert.isFalse(
				shouldExecuteInProcess(
					[
						`var fs = require("fs");`,
						`fs.writeFileSync("test.txt", "test");`,
					].join("\n"),
				),
			);
		});

		it("ignores nested and unrelated assignments", () => {
			assert.isFalse(
				shouldExecuteInProcess(
					[
						`function register() {`,
						`	module.exports = function () {};`,
						`}`,
						`exports.named = function () {};`,
						`module.other = function () {};`,
					].join("\n"),
				),
			);
		});

		it("does not throw on unparseable sources", () => {
			assert.isFalse(shouldExecuteInProcess(`}{ this is not ((javascript`));
			assert.isFalse(shouldExecuteInProcess(<any>null));
		});
	});

	it("should run non-hook files", async () => {
		const projectName = "projectDirectory";
		const projectPath = mkdtempSync(path.join(tmpdir(), `${projectName}-`));

		const testInjector = createTestInjector({ projectDir: projectPath });

		const script = [
			`var fs = require("fs");`,
			`var path = require("path");`,
			`fs.writeFileSync(path.join(__dirname, "../../js-test.txt"), "test");`,
		].join("\n");

		fs.mkdirSync(path.join(projectPath, "hooks"));
		fs.mkdirSync(path.join(projectPath, "hooks/after-prepare"));
		fs.writeFileSync(
			path.join(projectPath, "hooks/after-prepare/script.js"),
			script,
		);

		service = testInjector.resolve("$hooksService");

		await service.executeAfterHooks("prepare", { hookArgs: {} });

		assert(
			fs.existsSync(path.join(projectPath, "js-test.txt")),
			"javascript file did not run",
		);
	});
});
