import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { MetadataTrimService } from "../../lib/services/metadata-trim-service";
import {
	IMetadataToolchain,
	IMetadataTrimOptions,
	IMetadataUsage,
} from "../../lib/definitions/metadata-trim-service";
import { AndroidMetadataToolchain } from "../../lib/services/metadata-trim/android-toolchain";
import { AppleMetadataToolchain } from "../../lib/services/metadata-trim/apple-toolchain";

describe("metadataTrimService", () => {
	let directory: string;
	let bundle: string;
	let calls: string[];

	const errors = {
		fail(message: string) {
			throw new Error(message);
		},
	};
	const logger = { info() {} };

	function toolchain(usage: Partial<IMetadataUsage>): IMetadataToolchain {
		return {
			platforms: ["ios", "macos", "android"],
			async analyze() {
				calls.push("analyze");
				return {
					whitelistPath: "whitelist.mdg",
					patternCount: 3,
					unrestricted: false,
					...usage,
				};
			},
			async generate() {
				calls.push("generate");
				return { metadataPath: "out.nsmd", metadataBytes: 12 };
			},
			async install(_usage, metadataPath) {
				calls.push(`install:${metadataPath}`);
				return { installedTo: "target", replacedBytes: 34 };
			},
		};
	}

	function service(usage: Partial<IMetadataUsage> = {}) {
		const created = new MetadataTrimService(
			{} as any,
			errors as any,
			logger as any,
		);
		(created as any).toolchains = [toolchain(usage)];
		return created;
	}

	function options(
		overrides: Partial<IMetadataTrimOptions> = {},
	): IMetadataTrimOptions {
		return {
			platform: "macos",
			bundles: [bundle],
			outDir: path.join(directory, "out"),
			keep: [],
			...overrides,
		};
	}

	beforeEach(() => {
		calls = [];
		directory = fs.mkdtempSync(path.join(os.tmpdir(), "metadata-trim-"));
		bundle = path.join(directory, "bundle.js");
		fs.writeFileSync(bundle, "");
	});

	afterEach(() => {
		fs.rmSync(directory, { recursive: true, force: true });
	});

	it("runs analysis, generation and install in order", async () => {
		const result = await service().trim(options());

		assert.deepEqual(calls, ["analyze", "generate", "install:out.nsmd"]);
		assert.equal(result.metadataBytes, 12);
		assert.equal(result.installedTo, "target");
		assert.equal(result.replacedBytes, 34);
	});

	it("creates the output directory", async () => {
		await service().trim(options());

		assert.isTrue(fs.existsSync(path.join(directory, "out")));
	});

	it("stops without generating when usage cannot be bounded", async () => {
		let failure: Error;
		try {
			await service({ unrestricted: true }).trim(options());
		} catch (err) {
			failure = err as Error;
		}

		assert.match(failure.message, /Nothing was trimmed/);
		assert.deepEqual(calls, ["analyze"]);
	});

	it("fails on a bundle that does not exist", async () => {
		let failure: Error;
		try {
			await service().trim(options({ bundles: ["/missing/bundle.js"] }));
		} catch (err) {
			failure = err as Error;
		}

		assert.match(failure.message, /Cannot find the bundle/);
		assert.deepEqual(calls, []);
	});

	it("fails on a platform no toolchain supports", async () => {
		let failure: Error;
		try {
			await service().trim(options({ platform: "windows" }));
		} catch (err) {
			failure = err as Error;
		}

		assert.match(failure.message, /not available for windows/);
	});
});

describe("AndroidMetadataToolchain", () => {
	let directory: string;
	let project: string;
	let spawnOptions: any;

	const childProcess = {
		async spawnFromEvent(
			_command: string,
			args: string[],
			_event: string,
			options: any,
		) {
			spawnOptions = options;
			fs.writeFileSync(
				args[args.indexOf("--out") + 1],
				"# generated\nandroid.widget:SeekBar\n",
			);
		},
	};

	function options(
		overrides: Partial<IMetadataTrimOptions> = {},
	): IMetadataTrimOptions {
		return {
			platform: "android",
			bundles: ["/app/bundle.js"],
			outDir: directory,
			keep: [],
			androidProject: project,
			...overrides,
		};
	}

	beforeEach(() => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), "metadata-android-"));
		project = path.join(directory, "project");
		fs.mkdirSync(project);
	});

	afterEach(() => {
		fs.rmSync(directory, { recursive: true, force: true });
	});

	it("resolves the harvester's parser from the project's build tools", async () => {
		await new AndroidMetadataToolchain(childProcess as any).analyze(options());

		assert.equal(
			spawnOptions.env.NODE_PATH,
			path.join(project, "build-tools", "jsparser", "node_modules"),
		);
	});

	it("appends kept patterns to the whitelist", async () => {
		const usage = await new AndroidMetadataToolchain(
			childProcess as any,
		).analyze(options({ keep: ["android.webkit:*"] }));

		assert.equal(usage.patternCount, 2);
		assert.include(
			fs.readFileSync(usage.whitelistPath, "utf8"),
			"android.webkit:*",
		);
	});

	it("reports unbounded usage when the seed step wrote nothing", async () => {
		const silent = { async spawnFromEvent() {} };

		const usage = await new AndroidMetadataToolchain(silent as any).analyze(
			options(),
		);

		assert.isTrue(usage.unrestricted);
	});

	it("requires an Android project", async () => {
		let failure: Error;
		try {
			await new AndroidMetadataToolchain(childProcess as any).analyze(
				options({ androidProject: undefined }),
			);
		} catch (err) {
			failure = err as Error;
		}

		assert.match(failure.message, /--android-project/);
	});

	it("installs the whitelist and asks for the closure build", async () => {
		const toolchain = new AndroidMetadataToolchain(childProcess as any);
		const usage = await toolchain.analyze(options());

		const result = await toolchain.install(usage, undefined, options());

		assert.equal(result.installedTo, path.join(project, "whitelist.mdg"));
		assert.isTrue(fs.existsSync(result.installedTo));
		assert.match(result.nextStep, /-PnsFilterMetadata/);
	});
});

describe("AppleMetadataToolchain", () => {
	let directory: string;
	let spawned: { command: string; args: string[] }[];

	const childProcess = {
		async exec() {
			return "/sdk/path\n";
		},
		async spawnFromEvent(command: string, args: string[]) {
			spawned.push({ command, args });
			const output = args[args.indexOf("--output") + 1];
			if (args.includes("--output")) {
				fs.writeFileSync(output, "# generated\n*:NSSlider\nFoundation:*\n");
			}
			if (args.includes("-output-bin")) {
				fs.writeFileSync(args[args.indexOf("-output-bin") + 1], "NSMD");
			}
		},
	};

	function options(
		overrides: Partial<IMetadataTrimOptions> = {},
	): IMetadataTrimOptions {
		return {
			platform: "macos",
			bundles: ["/app/bundle.js"],
			outDir: directory,
			keep: [],
			analyzerPath: "/tools/analyzer",
			generatorPath: "/tools/generator",
			...overrides,
		};
	}

	beforeEach(() => {
		spawned = [];
		directory = fs.mkdtempSync(path.join(os.tmpdir(), "metadata-apple-"));
	});

	afterEach(() => {
		fs.rmSync(directory, { recursive: true, force: true });
	});

	it("counts the analyzer's patterns, ignoring comments", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);

		const usage = await toolchain.analyze(options());

		assert.equal(usage.patternCount, 2);
		assert.isFalse(usage.unrestricted);
	});

	it("passes kept patterns to the analyzer", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);

		await toolchain.analyze(options({ keep: ["UIKit:UIView", "MapKit:*"] }));

		const args = spawned[0].args;
		const keepFile = args[args.indexOf("--include-whitelist") + 1];
		assert.equal(fs.readFileSync(keepFile, "utf8"), "UIKit:UIView\nMapKit:*\n");
	});

	it("targets the iOS simulator by default", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);
		const usage = {
			whitelistPath: "w.mdg",
			patternCount: 1,
			unrestricted: false,
		};

		await toolchain.generate(usage, options({ platform: "ios" }));

		const args = spawned[0].args;
		assert.equal(
			args[args.indexOf("-target") + 1],
			"arm64-apple-ios15.0-simulator",
		);
	});

	it("names metadata by platform and architecture", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);
		const usage = {
			whitelistPath: "w.mdg",
			patternCount: 1,
			unrestricted: false,
		};

		const result = await toolchain.generate(usage, options({ arch: "x86_64" }));

		assert.equal(
			path.basename(result.metadataPath),
			"metadata.macos.x86_64.nsmd",
		);
	});

	it("does nothing to install without a framework", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);

		const result = await toolchain.install(
			{ whitelistPath: "w", patternCount: 1, unrestricted: false },
			"out.nsmd",
			options(),
		);

		assert.deepEqual(result, {});
	});

	it("requires a tool path", async () => {
		const toolchain = new AppleMetadataToolchain(childProcess as any);

		let failure: Error;
		try {
			await toolchain.analyze(options({ analyzerPath: undefined }));
		} catch (err) {
			failure = err as Error;
		}

		assert.match(failure.message, /--analyzer/);
	});
});
