import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";
import { FileSystem } from "../../lib/common/file-system";
import { setIsInteractive } from "../../lib/common/helpers";
import {
	CompiledReportService,
	computeSignature,
	environmentKey,
	extractDiagnostics,
	newIssueUrl,
	redact,
} from "../../lib/services/compiled-report-service";
import { CompiledReportCommand } from "../../lib/commands/compiled-report";

interface IGhCall {
	args: string[];
}

let projectDir: string;
let ghCalls: IGhCall[];
let ghResponses: {
	[subcommand: string]: {
		stdout?: string;
		stderr?: string;
		exitCode: number;
	}[];
};
let httpCalls: string[];
let httpResponse: () => Promise<{ body: string }>;
let logged: string[];
let opened: string[];
let confirms: { message: string; answer: boolean }[];
let confirmAnswers: boolean[];
let choiceAnswer: (choices: string[]) => string;
let options: any;

const FRAMEWORK_FIXTURES: {
	name: string;
	dependencies: { [name: string]: string };
	versionOf?: string;
}[] = [
	{
		name: "angular",
		dependencies: {
			"@nativescript/angular": "^20.0.0",
			"@angular/core": "~20.1.0",
		},
		versionOf: "@angular/core",
	},
	{
		name: "vue",
		dependencies: { "nativescript-vue": "^3.0.0" },
		versionOf: "nativescript-vue",
	},
	{
		name: "svelte",
		dependencies: {
			"@nativescript-community/svelte-native": "^1.0.0",
			svelte: "^5.0.0",
		},
		versionOf: "svelte",
	},
	{
		name: "react",
		dependencies: { "react-nativescript": "^5.0.0", react: "^18.3.1" },
		versionOf: "react",
	},
	{
		name: "solid",
		dependencies: {
			"@nativescript-community/solid-js": "^0.1.0",
			"solid-js": "^1.9.0",
		},
		versionOf: "solid-js",
	},
	{ name: "xml", dependencies: {} },
];

function writeFile(relative: string, content: string): void {
	const file = path.join(projectDir, relative);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

function createFixture(
	dependencies: { [name: string]: string },
	installed: { [name: string]: string } = {},
): void {
	writeFile(
		"package.json",
		JSON.stringify({
			name: "demo",
			dependencies: { "@nativescript/core": "~9.1.0", ...dependencies },
			devDependencies: { "@nativescript/compiler": "^0.4.0" },
		}),
	);
	for (const [name, version] of Object.entries({
		"@nativescript/core": "9.1.1",
		"@nativescript/compiler": "0.4.2",
		...installed,
	})) {
		writeFile(
			path.join("node_modules", name, "package.json"),
			JSON.stringify({ name, version }),
		);
	}
	writeFile(
		"app/main.ts",
		[
			"import { Utils } from '@nativescript/core';",
			"",
			"export function start() {",
			"  const app = Utils.ios.getter(UIApplication, UIApplication.sharedApplication);",
			"  return app;",
			"}",
			"",
		].join("\n"),
	);
}

const projectData = (): any => ({
	projectDir,
	projectName: "demo",
	platformsDir: path.join(projectDir, "platforms"),
	initializeProjectData: (): void => undefined,
});

function createInjector(): IInjector {
	const injector: IInjector = new Yok();
	injector.register("fs", FileSystem);
	injector.register("childProcess", {
		spawnFromEvent: async (command: string, args: string[]) => {
			assert.equal(command, "gh");
			ghCalls.push({ args });
			const key = args.slice(0, 2).join(" ");
			const response = ghResponses[key]?.shift() ?? {
				exitCode: 1,
				stderr: "not stubbed",
			};
			return { stdout: "", stderr: "", ...response };
		},
	});
	injector.register("httpClient", {
		httpRequest: async (request: { url: string }) => {
			httpCalls.push(request.url);
			return httpResponse();
		},
	});
	injector.register("logger", {
		info: (message: string) => logged.push(message),
		warn: (message: string) => logged.push(message),
		trace: (): void => undefined,
	});
	injector.register("staticConfig", { version: "9.1.2" });
	injector.register("sysInfo", { getXcodeVersion: async () => "26.0" });
	injector.register("errors", {
		fail: (message: string) => {
			throw new Error(message);
		},
	});
	injector.register("opener", { open: (url: string) => opened.push(url) });
	injector.register("options", options);
	injector.register("projectData", projectData());
	injector.register("prompter", {
		confirm: async (message: string) => {
			const answer = confirmAnswers.shift() ?? false;
			confirms.push({ message, answer });
			return answer;
		},
		promptForChoice: async (_: string, choices: string[]) =>
			choiceAnswer(choices),
	});
	injector.register("compiledReportService", CompiledReportService);
	injector.register("compiledReportCommand", CompiledReportCommand);
	return injector;
}

const refusal = () =>
	[
		"Compiling the app to native code (ios)...",
		`${projectDir}/app/main.ts:4:15: Utils.ios is not supported in a release build yet: Utils.ios.getter(UIApplication, UIApplication.sharedApplication)`,
		"file:///Users/someone/compiler/src/cli.ts:422",
		"  if (!args.includes('--keep-going')) throw new Error(...)",
		"Error: 1 constructs the release build cannot translate yet",
		"    at file:///Users/someone/compiler/src/cli.ts:422:51",
		"Node.js v24.4.0",
	].join("\n");

describe("compiledReportService", () => {
	beforeEach(() => {
		projectDir = fs.realpathSync(
			fs.mkdtempSync(path.join(os.tmpdir(), "compiled-report-")),
		);
		ghCalls = [];
		ghResponses = {};
		httpCalls = [];
		httpResponse = async () => ({ body: JSON.stringify({ items: [] }) });
		logged = [];
		opened = [];
		confirms = [];
		confirmAnswers = [];
		choiceAnswer = (choices) => choices[choices.length - 1];
		options = {};
		createFixture({});
	});

	afterEach(() => {
		setIsInteractive(undefined);
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	describe("redact", () => {
		it("makes project paths relative and hides the home folder, user names and secrets", () => {
			const text = [
				"/work/app/src/main.ts:3: failed",
				"file:///work/app/src/page.ts:9:2",
				"/Users/ada/Library/Developer/Xcode",
				"/home/ada/.gradle/caches",
				"-Pandroid.injected.signing.store.password=hunter2",
				"token: ghp_abcdefghijklmnopqrstuvwxyz0123456789",
				"https://ada:s3cret@registry.example.com/",
				"AKIAABCDEFGHIJKLMNOP",
			].join("\n");

			assert.equal(
				redact(text, "/work/app", "/Users/ada"),
				[
					"src/main.ts:3: failed",
					"src/page.ts:9:2",
					"~/Library/Developer/Xcode",
					"/home/<user>/.gradle/caches",
					"-Pandroid.injected.signing.store.password=<redacted>",
					"token: <redacted>",
					"https://ada:<redacted>@registry.example.com/",
					"<token>",
				].join("\n"),
			);
		});
	});

	describe("computeSignature", () => {
		it("is the same for the same refusal in another app, file and line", () => {
			assert.equal(
				computeSignature(
					"compile-refused",
					"Utils.ios is not supported in a release build yet",
				),
				computeSignature(
					"compile-refused",
					"Utils.ios is not supported in a release build yet",
				),
			);
			assert.equal(
				computeSignature(
					"native-compile",
					"cannot convert value of type 'Int' to 'String' (Home.swift:12:4)",
				),
				computeSignature(
					"native-compile",
					"cannot convert value of type 'Int' to 'String' (Settings.swift:40:9)",
				),
			);
		});

		it("keeps the types and members a Swift or Kotlin error quotes", () => {
			assert.notEqual(
				computeSignature(
					"native-compile",
					"cannot convert value of type 'Int' to expected argument type 'String'",
				),
				computeSignature(
					"native-compile",
					"cannot convert value of type 'Double' to expected argument type 'String'",
				),
			);
		});

		it("differs for another API or another kind", () => {
			const sig = computeSignature(
				"compile-refused",
				"Utils.ios is not supported in a release build yet",
			);
			assert.notEqual(
				sig,
				computeSignature(
					"compile-refused",
					"Utils.android is not supported in a release build yet",
				),
			);
			assert.notEqual(
				sig,
				computeSignature(
					"runtime",
					"Utils.ios is not supported in a release build yet",
				),
			);
			assert.match(sig, /^[0-9a-f]{6}$/);
		});
	});

	describe("extractDiagnostics", () => {
		it("takes the compiler's located refusals, not its own stack", () => {
			assert.deepStrictEqual(extractDiagnostics("compile-refused", refusal()), [
				`${projectDir}/app/main.ts:4:15: Utils.ios is not supported in a release build yet: Utils.ios.getter(UIApplication, UIApplication.sharedApplication)`,
			]);
		});

		it("takes the refusal the compiler throws without --all-errors", () => {
			assert.deepStrictEqual(
				extractDiagnostics(
					"compile-refused",
					"file:///c/src/swift.ts:12\n\nError: /app/main.ts:4:5: a class declared inside a function is not supported in a release build yet: class Local {}\n    at x (y.js:1:1)",
				),
				[
					"/app/main.ts:4:5: a class declared inside a function is not supported in a release build yet: class Local {}",
				],
			);
		});

		it("falls back to the compiler's error when nothing is located", () => {
			assert.deepStrictEqual(
				extractDiagnostics(
					"compile-refused",
					"Error: the app does not type-check as the release build sees it:\napp/main.ts(3,1): error TS2304\n    at x (y.js:1:1)",
				),
				[
					"the app does not type-check as the release build sees it:",
					"app/main.ts(3,1): error TS2304",
				],
			);
		});

		it("takes swiftc's, Kotlin's and Gradle's errors", () => {
			assert.deepStrictEqual(
				extractDiagnostics(
					"native-compile",
					"\x1b[1m/app/main.ts:3:5: error: cannot find 'x' in scope\x1b[0m\n** BUILD FAILED **",
				),
				["/app/main.ts:3:5: error: cannot find 'x' in scope"],
			);
			assert.deepStrictEqual(
				extractDiagnostics(
					"native-compile",
					"e: file:///p/Home.kt:14:9 Unresolved reference 'x'.\nFAILURE",
				),
				["e: file:///p/Home.kt:14:9 Unresolved reference 'x'."],
			);
			assert.deepStrictEqual(
				extractDiagnostics(
					"native-compile",
					"FAILURE: Build failed with an exception.\n* What went wrong:\nExecution failed for task ':mergeReleaseResources'.\n* Try:",
				),
				["Execution failed for task ':mergeReleaseResources'.", "* Try:"],
			);
		});

		it("takes a runtime error from its first error line", () => {
			assert.deepStrictEqual(
				extractDiagnostics(
					"runtime",
					"2026-10-14 12:00:01 demo[123] CONSOLE ERROR: TypeError: Cannot read properties of undefined (reading 'name')\n    at start (app/main.ts:4:9)",
				),
				[
					"TypeError: Cannot read properties of undefined (reading 'name')",
					"at start (app/main.ts:4:9)",
				],
			);
		});
	});

	describe("createReport", () => {
		for (const fixture of FRAMEWORK_FIXTURES) {
			it(`labels a ${fixture.name} project and names its version`, async () => {
				const installed = fixture.versionOf
					? { [fixture.versionOf]: "1.2.3" }
					: {};
				createFixture(fixture.dependencies, installed);
				const service: CompiledReportService = createInjector().resolve(
					"compiledReportService",
				);

				const report = await service.createReport(projectData(), {
					kind: "compile-refused",
					platform: "ios",
					createdAt: "",
					output: refusal(),
				});

				assert.deepStrictEqual(report.labels, [
					"compiled",
					"platform:ios",
					`framework:${fixture.name}`,
					"kind:compile-refused",
				]);
				const environment = new Map(report.environment);
				assert.equal(
					environment.get("Framework"),
					fixture.versionOf ? `${fixture.name} 1.2.3` : "xml",
				);
				assert.equal(environment.get("@nativescript/compiler"), "0.4.2");
				assert.equal(environment.get("@nativescript/core"), "9.1.1");
				assert.equal(environment.get("Xcode"), "26.0");
			});
		}

		it("titles the issue with the signature and keeps code out of the body unless asked", async () => {
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			const report = await service.createReport(projectData(), {
				kind: "compile-refused",
				platform: "ios",
				createdAt: "",
				output: refusal(),
			});

			assert.equal(
				report.title,
				`[compiled][ios] Utils.ios is not supported in a release build yet (sig ${report.signature})`,
			);
			assert.deepStrictEqual(report.location, { file: "app/main.ts", line: 4 });
			assert.include(
				report.code,
				"4 >   const app = Utils.ios.getter(UIApplication, UIApplication.sharedApplication);",
			);
			assert.include(
				report.code,
				"1 | import { Utils } from '@nativescript/core';",
			);
			const body = service.formatBody(report, false);
			assert.include(
				body,
				"### Diagnostic\n\n```text\napp/main.ts:4:15: Utils.ios is not supported in a release build yet\n```",
			);
			assert.include(
				body,
				"### Platform\n\nios\n\n### Framework\n\nxml\n\n### Kind\n\ncompile-refused",
			);
			assert.include(body, `### Signature\n\n${report.signature}`);
			assert.notInclude(body, "UIApplication");
			assert.notInclude(body, projectDir);
			assert.include(
				service.formatBody(report, true),
				"Utils.ios.getter(UIApplication",
			);
		});

		it("reads the location of a refusal the compiler prints as an error", async () => {
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			const report = await service.createReport(projectData(), {
				kind: "compile-refused",
				platform: "android",
				createdAt: "",
				output: `error: ${projectDir}/app/main.ts:4:15: Array.prototype is not supported in a release build yet: Array.prototype\n`,
			});

			assert.deepStrictEqual(report.diagnostics, [
				{
					location: "app/main.ts:4:15",
					message: "Array.prototype is not supported in a release build yet",
					snippet: "Array.prototype",
				},
			]);
			assert.equal(
				report.title,
				`[compiled][android] Array.prototype is not supported in a release build yet (sig ${report.signature})`,
			);
		});

		it("lists Gradle, the Android Gradle Plugin and Kotlin for Android", async () => {
			writeFile(
				"node_modules/@nativescript/compiler/kit-android/gradle/wrapper/gradle-wrapper.properties",
				"distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip\n",
			);
			writeFile(
				"platforms/compiled/android/build.gradle.kts",
				'plugins {\n    id("com.android.application") version "8.12.1"\n    id("org.jetbrains.kotlin.android") version "2.2.20"\n}\n',
			);
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			const report = await service.createReport(projectData(), {
				kind: "native-compile",
				platform: "android",
				createdAt: "",
				output: "e: app/main.ts:4: Unresolved reference 'x'.",
			});

			const environment = new Map(report.environment);
			assert.equal(environment.get("Gradle"), "8.14.3");
			assert.equal(environment.get("Android Gradle Plugin"), "8.12.1");
			assert.equal(environment.get("Kotlin"), "2.2.20");
		});

		it("reads the Android Gradle Plugin and Kotlin from the compiler when the compile stopped before Gradle", async () => {
			writeFile(
				"node_modules/@nativescript/compiler/src/android.ts",
				'const settings = `plugins {\n    id("com.android.application") version "8.13.0"\n    id("org.jetbrains.kotlin.android") version "2.2.21"\n}`;\n',
			);
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			const report = await service.createReport(projectData(), {
				kind: "compile-refused",
				platform: "android",
				createdAt: "",
				output:
					"error: app/main.ts:4:1: Array.prototype is not supported in a release build yet: Array.prototype",
			});

			const environment = new Map(report.environment);
			assert.equal(environment.get("Android Gradle Plugin"), "8.13.0");
			assert.equal(environment.get("Kotlin"), "2.2.21");
		});
	});

	describe("environmentKey", () => {
		it("reads platform, framework and the compiler's and core's major.minor from a report", () => {
			const body = [
				"### Platform",
				"",
				"ios",
				"",
				"### Framework",
				"",
				"angular",
				"",
				"### Environment",
				"",
				"| @nativescript/compiler | 0.4.2 |",
				"| @nativescript/core | 9.1.1 |",
			].join("\n");

			assert.equal(environmentKey(body), "ios|angular|0.4|9.1");
			assert.isUndefined(environmentKey("+1, same here"));
		});
	});

	describe("newIssueUrl", () => {
		const fields = (environment: string) => ({
			platform: "ios",
			framework: "vue",
			kind: "runtime",
			signature: "abc123",
			diagnostic: "TypeError: x",
			source: "",
			environment,
		});

		it("fills the issue form's fields", () => {
			const url = new URL(
				newIssueUrl("title", fields("| a | b |"), ["compiled"]).url,
			);

			assert.equal(url.pathname, "/NativeScript/NativeScript/issues/new");
			assert.equal(url.searchParams.get("template"), "compiled.yml");
			assert.equal(url.searchParams.get("platform"), "ios");
			assert.equal(url.searchParams.get("framework"), "vue");
			assert.equal(url.searchParams.get("signature"), "abc123");
			assert.equal(url.searchParams.get("environment"), "| a | b |");
		});

		it("cuts the longest field to fit GitHub's URL limit and says so", () => {
			const long = Array.from(
				{ length: 2000 },
				(_, k) => `- dependency-${k} 1.0.0`,
			).join("\n");

			const { url, truncated } = newIssueUrl("title", fields(long), [
				"compiled",
			]);

			assert.isTrue(truncated);
			assert.isAtMost(url.length, 8000);
			assert.include(
				new URL(url).searchParams.get("environment"),
				"(Cut to fit a URL.)",
			);
			assert.equal(new URL(url).searchParams.get("diagnostic"), "TypeError: x");
			assert.isFalse(
				newIssueUrl("title", fields("short"), ["compiled"]).truncated,
			);
		});
	});

	describe("findIssues", () => {
		it("searches with gh when it is signed in", async () => {
			ghResponses["issue list"] = [
				{
					exitCode: 0,
					stdout: JSON.stringify([
						{ number: 7, title: "t (sig abc123)", state: "OPEN", url: "u" },
					]),
				},
			];
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			assert.deepStrictEqual(await service.findIssues("abc123", true), [
				{ number: 7, title: "t (sig abc123)", state: "OPEN", url: "u" },
			]);
			assert.include(ghCalls[0].args, '"sig abc123" in:title');
			assert.include(ghCalls[0].args, "all");
			assert.lengthOf(httpCalls, 0);
		});

		it("searches GitHub's public API without gh, and gives up offline", async () => {
			httpResponse = async () => ({
				body: JSON.stringify({
					items: [{ number: 9, title: "t", state: "closed", html_url: "h" }],
				}),
			});
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);

			assert.deepStrictEqual(await service.findIssues("abc123", false), [
				{ number: 9, title: "t", state: "closed", url: "h" },
			]);
			assert.include(
				decodeURIComponent(httpCalls[0]),
				'repo:NativeScript/NativeScript is:issue "sig abc123" in:title',
			);

			httpResponse = async () => {
				throw new Error("getaddrinfo ENOTFOUND api.github.com");
			};
			assert.isNull(await service.findIssues("abc123", false));
		});
	});

	describe("createIssue", () => {
		it("files without labels when GitHub refuses them", async () => {
			ghResponses["issue create"] = [
				{
					exitCode: 1,
					stderr: "could not add label: 'kind:runtime' not found",
				},
				{
					exitCode: 0,
					stdout: "https://github.com/NativeScript/NativeScript/issues/1\n",
				},
			];
			const service: CompiledReportService = createInjector().resolve(
				"compiledReportService",
			);
			const report = await service.createReport(projectData(), {
				kind: "runtime",
				platform: "ios",
				createdAt: "",
				output: "TypeError: x",
			});

			assert.equal(
				await service.createIssue(projectData(), report, "body"),
				"https://github.com/NativeScript/NativeScript/issues/1",
			);
			assert.include(ghCalls[0].args, "--label");
			assert.notInclude(ghCalls[1].args, "--label");
		});
	});
});

describe("ns compiled report", () => {
	let draftFile: string;

	beforeEach(() => {
		projectDir = fs.realpathSync(
			fs.mkdtempSync(path.join(os.tmpdir(), "compiled-report-")),
		);
		ghCalls = [];
		ghResponses = {};
		httpCalls = [];
		httpResponse = async () => ({ body: JSON.stringify({ items: [] }) });
		logged = [];
		opened = [];
		confirms = [];
		confirmAnswers = [];
		choiceAnswer = (choices) => choices[choices.length - 1];
		options = {};
		createFixture(
			{ "@nativescript/angular": "^20.0.0" },
			{ "@angular/core": "20.1.0" },
		);
		draftFile = path.join(
			projectDir,
			"platforms",
			"compiled",
			"ios",
			"report.json",
		);
		writeFile(
			"platforms/compiled/ios/report.json",
			JSON.stringify({
				kind: "compile-refused",
				platform: "ios",
				createdAt: "2026-10-14T00:00:00.000Z",
				output: refusal(),
			}),
		);
	});

	afterEach(() => {
		setIsInteractive(undefined);
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	const run = (args: string[] = []) =>
		createInjector()
			.resolve<CompiledReportCommand>("compiledReportCommand")
			.execute(args);
	const output = () => logged.join("\n");

	it("prints the title, labels, body and URL with --dry-run, and sends nothing", async () => {
		setIsInteractive(() => true);
		options.dryRun = true;

		await run();

		assert.include(
			output(),
			"Title:  [compiled][ios] Utils.ios is not supported in a release build yet (sig ",
		);
		assert.include(
			output(),
			"Labels: compiled, platform:ios, framework:angular, kind:compile-refused",
		);
		assert.include(
			output(),
			"https://github.com/NativeScript/NativeScript/issues/new?template=compiled.yml&title=",
		);
		assert.include(output(), "Dry run: nothing was sent.");
		assert.lengthOf(ghCalls, 0);
		assert.lengthOf(httpCalls, 0);
		assert.lengthOf(confirms, 0);
		assert.lengthOf(opened, 0);
	});

	it("sends nothing from a terminal that cannot answer", async () => {
		setIsInteractive(() => false);
		options.yes = true;

		await run(["ios"]);

		assert.include(output(), "Nothing was sent");
		assert.lengthOf(ghCalls, 0);
		assert.lengthOf(httpCalls, 0);
	});

	it("sends nothing when the reporter declines", async () => {
		setIsInteractive(() => true);
		confirmAnswers = [false];

		await run();

		assert.lengthOf(confirms, 1);
		assert.lengthOf(ghCalls, 0);
		assert.lengthOf(httpCalls, 0);
	});

	const existing = () => [
		{
			exitCode: 0,
			stdout: JSON.stringify([
				{
					number: 42,
					title: "t",
					state: "OPEN",
					url: "https://github.com/NativeScript/NativeScript/issues/42",
				},
			]),
		},
	];

	it("adds a 👍 alone when an earlier report has this environment", async () => {
		setIsInteractive(() => true);
		options.yes = true;
		ghResponses["auth status"] = [{ exitCode: 0 }];
		ghResponses["issue list"] = existing();
		ghResponses["api --method"] = [{ exitCode: 0 }];
		ghResponses["issue view"] = [
			{
				exitCode: 0,
				stdout: JSON.stringify({
					body: "### Platform\n\nandroid\n\n### Framework\n\nangular\n",
					comments: [
						{
							body: "### Platform\n\nios\n\n### Framework\n\nangular\n\n| @nativescript/compiler | 0.4.9 |\n| @nativescript/core | 9.1.0 |",
						},
					],
				}),
			},
		];
		choiceAnswer = (choices) => choices[0];

		await run();

		const reaction = ghCalls.find((c) => c.args[0] === "api");
		assert.deepStrictEqual(reaction.args, [
			"api",
			"--method",
			"POST",
			"repos/NativeScript/NativeScript/issues/42/reactions",
			"-f",
			"content=+1",
		]);
		assert.isUndefined(ghCalls.find((c) => c.args[1] === "comment"));
		assert.include(
			output(),
			"Added a 👍 to https://github.com/NativeScript/NativeScript/issues/42",
		);
	});

	it("adds a 👍 and the environment when no earlier report has it", async () => {
		setIsInteractive(() => true);
		options.yes = true;
		ghResponses["auth status"] = [{ exitCode: 0 }];
		ghResponses["issue list"] = existing();
		ghResponses["api --method"] = [{ exitCode: 0 }];
		ghResponses["issue view"] = [
			{
				exitCode: 0,
				stdout: JSON.stringify({
					body: "### Platform\n\nios\n\n### Framework\n\nvue\n",
					comments: [{ body: "same here" }],
				}),
			},
		];
		ghResponses["issue comment"] = [{ exitCode: 0 }];
		choiceAnswer = (choices) => choices[0];

		await run();

		assert.lengthOf(confirms, 0);
		assert.isDefined(ghCalls.find((c) => c.args[0] === "api"));
		const comment = ghCalls.find((c) => c.args[1] === "comment");
		assert.deepStrictEqual(comment.args.slice(0, 5), [
			"issue",
			"comment",
			"42",
			"--repo",
			"NativeScript/NativeScript",
		]);
		const body = fs.readFileSync(comment.args[comment.args.length - 1], "utf8");
		assert.include(body, "+1 from `ns compiled report`");
		assert.equal(environmentKey(body), "ios|angular|0.4|9.1");
		assert.notInclude(body, "UIApplication");
		assert.include(output(), "Added your environment to");
	});

	it("asks again before the code goes in, even with --yes, and files with gh", async () => {
		setIsInteractive(() => true);
		options.yes = true;
		confirmAnswers = [false];
		ghResponses["auth status"] = [{ exitCode: 0 }];
		ghResponses["issue list"] = [{ exitCode: 0, stdout: "[]" }];
		ghResponses["issue create"] = [
			{
				exitCode: 0,
				stdout: "https://github.com/NativeScript/NativeScript/issues/43\n",
			},
		];

		await run();

		assert.lengthOf(confirms, 1);
		assert.include(confirms[0].message, "Include these lines of app/main.ts");
		const create = ghCalls.find((c) => c.args[1] === "create");
		assert.includeMembers(create.args, [
			"--label",
			"compiled",
			"platform:ios",
			"framework:angular",
			"kind:compile-refused",
		]);
		const body = fs.readFileSync(
			create.args[create.args.indexOf("--body-file") + 1],
			"utf8",
		);
		assert.notInclude(body, "reporter's consent");
		assert.include(
			output(),
			"Filed https://github.com/NativeScript/NativeScript/issues/43",
		);
	});

	it("opens a prefilled issue without gh, with the code the reporter agreed to", async () => {
		setIsInteractive(() => true);
		confirmAnswers = [true, true];
		ghResponses["auth status"] = [{ exitCode: 1, stderr: "not logged in" }];

		await run();

		assert.lengthOf(httpCalls, 1);
		assert.lengthOf(opened, 1);
		const url = new URL(opened[0]);
		assert.equal(
			url.searchParams.get("labels"),
			"compiled,platform:ios,framework:angular,kind:compile-refused",
		);
		assert.equal(url.searchParams.get("template"), "compiled.yml");
		assert.include(
			url.searchParams.get("source"),
			"Shared with the reporter's consent:",
		);
		assert.include(url.searchParams.get("environment"), "Labels: `compiled`");
		assert.notInclude(url.search, encodeURIComponent(projectDir));
	});

	it("reports a pasted runtime error with --error", async () => {
		setIsInteractive(() => false);
		fs.rmSync(draftFile);
		writeFile(
			"error.txt",
			"CONSOLE ERROR: TypeError: Cannot read properties of undefined (reading 'name')\n    at start (app/main.ts:4:9)\n",
		);
		options.error = path.join(projectDir, "error.txt");

		await run(["android"]);

		assert.include(
			output(),
			"Title:  [compiled][android] TypeError: Cannot read properties of undefined (reading 'name') (sig ",
		);
		assert.include(output(), "kind:runtime");
		assert.include(output(), "`app/main.ts:4`");
	});

	it("says how to make a report when there is nothing to report", async () => {
		fs.rmSync(draftFile);

		let error: Error;
		try {
			await run(["android"]);
		} catch (err) {
			error = err;
		}

		assert.include(
			error.message,
			"No failed --compiled build for android to report.",
		);
	});
});
