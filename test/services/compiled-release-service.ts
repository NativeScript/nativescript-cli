import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Yok } from "../../lib/common/yok";
import { IInjector } from "../../lib/common/definitions/yok";
import { CompiledReleaseService } from "../../lib/services/compiled-release-service";
import { IGradleCommandOptions } from "../../lib/definitions/gradle";

interface ISpawnCall {
	command: string;
	args: string[];
	options: any;
}

let projectDir: string;
let spawnCalls: ISpawnCall[];
let gradleCalls: { args: string[]; options: IGradleCommandOptions }[];
let xcodebuildCalls: string[][];
let writtenFiles: { [path: string]: string };
let warnings: string[];
let hookCalls: { name: string; args: any }[];

function createProjectData(nsConfig: any = {}): any {
	return {
		projectDir,
		projectName: "demo",
		platformsDir: path.join(projectDir, "platforms"),
		projectIdentifiers: {
			ios: "org.example.demo",
			android: "org.example.demo",
		},
		nsConfig,
	};
}

function createService(nsConfig: any = {}): CompiledReleaseService {
	const injector: IInjector = new Yok();
	injector.register("childProcess", {
		spawnFromEvent: async (
			command: string,
			args: string[],
			_: string,
			options: any,
		) => {
			spawnCalls.push({ command, args, options });
			return { stdout: "", stderr: "", exitCode: 0 };
		},
	});
	injector.register("errors", {
		fail: (message: string) => {
			throw new Error(message);
		},
	});
	injector.register("exportOptionsPlistService", {});
	injector.register("fs", {
		exists: (file: string) =>
			path.basename(file) === "ns-native-project.json"
				? fs.existsSync(file)
				: true,
		readJson: (file: string) => JSON.parse(fs.readFileSync(file, "utf8")),
		deleteDirectory: (): void => undefined,
		deleteFile: (): void => undefined,
		ensureDirectoryExists: (): void => undefined,
		writeFile: (file: string, content: string) => {
			writtenFiles[file] = content;
		},
	});
	injector.register("gradleCommandService", {
		executeCommand: async (args: string[], options: IGradleCommandOptions) => {
			gradleCalls.push({ args, options });
		},
	});
	injector.register("iOSProvisionService", {
		pick: async (uuidOrName: string) =>
			uuidOrName === "Demo Profile"
				? { UUID: "1234-ABCD", Type: "AdHoc", TeamIdentifier: ["TEAM123"] }
				: undefined,
	});
	injector.register("logger", {
		info: (): void => undefined,
		warn: (message: string) => warnings.push(message),
	});
	injector.register("mobileHelper", {
		isAndroidPlatform: (platform: string) =>
			platform.toLowerCase() === "android",
		isiOSPlatform: (platform: string) => platform.toLowerCase() === "ios",
	});
	injector.register("projectDataService", {
		getProjectData: () => createProjectData(nsConfig),
	});
	injector.register("xcodebuildCommandService", {
		executeCommand: async (args: string[]) => {
			xcodebuildCalls.push(args);
		},
	});
	injector.register("hooksService", {
		hookArgsName: "hookArgs",
		executeBeforeHooks: async (name: string, args: any) => {
			hookCalls.push({ name: `before-${name}`, args });
		},
		executeAfterHooks: async (name: string, args: any) => {
			hookCalls.push({ name: `after-${name}`, args });
		},
	});
	injector.register("compiledReleaseService", CompiledReleaseService);

	return injector.resolve("compiledReleaseService");
}

function installCompilerPackage(): string {
	const packageDir = path.join(
		projectDir,
		"node_modules",
		"@nativescript",
		"compiler",
	);
	fs.mkdirSync(packageDir, { recursive: true });
	fs.writeFileSync(
		path.join(packageDir, "package.json"),
		JSON.stringify({
			name: "@nativescript/compiler",
			bin: { "ns-native": "bin/ns-native.js" },
		}),
	);
	return fs.realpathSync(packageDir);
}

const platformData = (platform: string): any => ({
	platformNameLowerCase: platform.toLowerCase(),
	normalizedPlatformName: platform,
});

describe("compiledReleaseService", () => {
	beforeEach(() => {
		projectDir = fs.realpathSync(
			fs.mkdtempSync(path.join(os.tmpdir(), "compiled-release-")),
		);
		spawnCalls = [];
		gradleCalls = [];
		xcodebuildCalls = [];
		writtenFiles = {};
		warnings = [];
		hookCalls = [];
	});

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	describe("isCompiledRelease", () => {
		const testCases = [
			{
				name: "a debug build, even with --compiled",
				options: { release: false, compiled: true },
				nsConfig: { release: { compiled: true } },
				expected: false,
			},
			{
				name: "a release build without flag or config",
				options: { release: true },
				nsConfig: {},
				expected: false,
			},
			{
				name: "a release build with --compiled",
				options: { release: true, compiled: true },
				nsConfig: {},
				expected: true,
			},
			{
				name: "a release build with release.compiled in the config",
				options: { release: true },
				nsConfig: { release: { compiled: true } },
				expected: true,
			},
			{
				name: "a release build with --no-compiled over the config",
				options: { release: true, compiled: false },
				nsConfig: { release: { compiled: true } },
				expected: false,
			},
			{
				name: "a release build whose platform opts out in the config",
				options: { release: true },
				nsConfig: {
					release: { compiled: true },
					android: { release: { compiled: false } },
				},
				expected: false,
			},
			{
				name: "a release build with --compiled over the platform's opt-out",
				options: { release: true, compiled: true },
				nsConfig: { android: { release: { compiled: false } } },
				expected: true,
			},
			{
				name: "a release build whose platform alone opts in",
				options: { release: true },
				nsConfig: { android: { release: { compiled: true } } },
				expected: true,
			},
		];

		testCases.forEach((testCase) => {
			it(`is ${testCase.expected} for ${testCase.name}`, () => {
				const service = createService(testCase.nsConfig);
				assert.equal(
					service.isCompiledRelease({
						projectDir,
						platform: "Android",
						...testCase.options,
					}),
					testCase.expected,
				);
			});
		});
	});

	describe("prepare", () => {
		it("runs the project's compiler with the CLI's node, writing to platforms/compiled/<platform>", async () => {
			const packageDir = installCompilerPackage();
			const service = createService();

			await service.prepare(platformData("iOS"), createProjectData());

			assert.lengthOf(spawnCalls, 1);
			assert.equal(spawnCalls[0].command, process.execPath);
			assert.deepStrictEqual(spawnCalls[0].args, [
				path.join(packageDir, "bin", "ns-native.js"),
				projectDir,
				"--platform",
				"ios",
				"--out",
				path.join(projectDir, "platforms", "compiled", "ios"),
				"--name",
				"demo",
				"--bundle",
				"org.example.demo",
			]);
		});

		it("explains how to install the compiler when the project lacks it", async () => {
			const service = createService();

			let error: Error;
			try {
				await service.prepare(platformData("iOS"), createProjectData());
			} catch (err) {
				error = err;
			}

			assert.include(
				error.message,
				"npm install --save-dev @nativescript/compiler",
			);
			assert.lengthOf(spawnCalls, 0);
		});

		it("refuses platforms the compiler does not target", async () => {
			installCompilerPackage();
			const service = createService();

			let error: Error;
			try {
				await service.prepare(platformData("visionOS"), createProjectData());
			} catch (err) {
				error = err;
			}

			assert.include(error.message, "not visionOS");
		});
	});

	describe("build", () => {
		const keyStore = {
			keyStorePath: "keys/release.keystore",
			keyStorePassword: "store-pass",
			keyStoreAlias: "upload",
			keyStoreAliasPassword: "key-pass",
		};

		it("signs the Android build with the --key-store-* options", async () => {
			const packageDir = installCompilerPackage();
			const service = createService();

			const result = await service.build(
				platformData("Android"),
				createProjectData(),
				<any>{ release: true, ...keyStore },
			);

			const projectRoot = path.join(
				projectDir,
				"platforms",
				"compiled",
				"android",
			);
			assert.lengthOf(gradleCalls, 1);
			assert.deepStrictEqual(gradleCalls[0].args, [
				"-p",
				projectRoot,
				":assembleRelease",
				"--quiet",
				`-Pandroid.injected.signing.store.file=${path.resolve("keys/release.keystore")}`,
				"-Pandroid.injected.signing.store.password=store-pass",
				"-Pandroid.injected.signing.key.alias=upload",
				"-Pandroid.injected.signing.key.password=key-pass",
			]);
			assert.equal(
				gradleCalls[0].options.gradlePath,
				path.join(packageDir, "kit-android", "gradlew"),
			);
			assert.equal(
				result,
				path.join(
					projectRoot,
					"build",
					"outputs",
					"apk",
					"release",
					"demo-release.apk",
				),
			);
		});

		it("builds an App Bundle for --aab", async () => {
			installCompilerPackage();
			const service = createService();

			const result = await service.build(
				platformData("Android"),
				createProjectData(),
				<any>{ release: true, androidBundle: true, ...keyStore },
			);

			assert.equal(gradleCalls[0].args[2], ":bundleRelease");
			assert.match(result, /bundle\/release\/demo-release\.aab$/);
		});

		it("builds the iOS simulator app", async () => {
			const service = createService();

			const result = await service.build(
				platformData("iOS"),
				createProjectData(),
				<any>{ release: true, buildForDevice: false },
			);

			assert.deepStrictEqual(spawnCalls[0].args, ["generate", "--quiet"]);
			assert.lengthOf(xcodebuildCalls, 1);
			assert.include(xcodebuildCalls[0], "generic/platform=iOS Simulator");
			assert.match(
				result,
				/DerivedData\/Build\/Products\/Release-iphonesimulator\/demo\.app$/,
			);
		});

		it("runs the project's build hooks around the compiled build, with the compiled project as projectRoot", async () => {
			const service = createService();

			await service.build(
				platformData("iOS"),
				createProjectData(),
				<any>{ release: true, buildForDevice: false },
			);

			assert.deepStrictEqual(
				hookCalls.map((c) => c.name),
				["before-buildIOS", "after-buildIOS"],
			);
			assert.equal(
				hookCalls[0].args.hookArgs.projectRoot,
				path.join(projectDir, "platforms", "compiled", "ios"),
			);
			assert.equal(hookCalls[0].args.hookArgs.buildData.release, true);
		});

		it("archives an unsigned device build without --team-id or --provision", async () => {
			const service = createService();

			const result = await service.build(
				platformData("iOS"),
				createProjectData(),
				<any>{ release: true, buildForDevice: true },
			);

			assert.lengthOf(xcodebuildCalls, 1);
			assert.include(xcodebuildCalls[0], "archive");
			assert.notInclude(xcodebuildCalls[0], "CODE_SIGNING_ALLOWED=YES");
			assert.include(xcodebuildCalls[0], "CODE_SIGNING_ALLOWED=NO");
			assert.lengthOf(warnings, 1);
			assert.match(result, /build\/demo\.ipa$/);
		});

		it("signs with --provision at export, leaving the kit's package target unsigned", async () => {
			const service = createService();

			const result = await service.build(
				platformData("iOS"),
				createProjectData(),
				<any>{ release: true, buildForDevice: true, provision: "Demo Profile" },
			);

			assert.lengthOf(xcodebuildCalls, 2);
			assert.include(xcodebuildCalls[0], "CODE_SIGNING_ALLOWED=NO");
			assert.isFalse(
				xcodebuildCalls[0].some((arg) =>
					arg.startsWith("PROVISIONING_PROFILE"),
				),
			);
			assert.include(xcodebuildCalls[1], "-exportArchive");
			const exportOptions =
				writtenFiles[
					xcodebuildCalls[1][
						xcodebuildCalls[1].indexOf("-exportOptionsPlist") + 1
					]
				];
			assert.include(exportOptions, "<string>ad-hoc</string>");
			assert.include(exportOptions, "<string>TEAM123</string>");
			assert.include(
				exportOptions,
				"<key>org.example.demo</key>\n\t\t<string>1234-ABCD</string>",
			);
			assert.match(result, /build\/demo\.ipa$/);
		});
	});
});
