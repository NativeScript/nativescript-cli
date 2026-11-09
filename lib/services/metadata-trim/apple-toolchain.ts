import * as fs from "fs";
import * as path from "path";
import { IChildProcess } from "../../common/declarations";
import {
	IMetadataToolchain,
	IMetadataTrimOptions,
	IMetadataTrimResult,
	IMetadataUsage,
} from "../../definitions/metadata-trim-service";
import {
	embeddedMetadataVersion,
	metadataFileVersion,
	replaceEmbeddedMetadata,
} from "./macho-metadata";

const ANALYZER_NAME = "ns-metadata-symbols";
const GENERATOR_NAME = "objc-metadata-generator";

export const UNRESTRICTED_PATTERN = "*:*";

export function readFilterPatterns(filePath: string): string[] {
	return fs
		.readFileSync(filePath, "utf8")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#") && !line.startsWith("//"));
}

function frameworkBinary(framework: string): string {
	const versioned = path.join(framework, "Versions", "A", "NativeScript");
	return fs.existsSync(versioned)
		? versioned
		: path.join(framework, "NativeScript");
}

export class AppleMetadataToolchain implements IMetadataToolchain {
	public readonly platforms = ["ios", "macos"];

	constructor(private $childProcess: IChildProcess) {}

	public async analyze(options: IMetadataTrimOptions): Promise<IMetadataUsage> {
		const whitelistPath = path.join(
			options.outDir,
			`whitelist.${options.platform}.mdg`,
		);
		const args = ["--output", whitelistPath];
		if (options.keep.length) {
			const keepPath = path.join(options.outDir, "keep.mdg");
			fs.writeFileSync(keepPath, options.keep.join("\n") + "\n");
			args.push("--include-whitelist", keepPath);
		}
		await this.run(
			this.tool(options.analyzerPath, ANALYZER_NAME, "--analyzer"),
			[...args, ...options.bundles],
		);
		const patterns = readFilterPatterns(whitelistPath);
		return {
			whitelistPath,
			patternCount: patterns.length,
			unrestricted: patterns.includes(UNRESTRICTED_PATTERN),
		};
	}

	public async generate(
		usage: IMetadataUsage,
		options: IMetadataTrimOptions,
	): Promise<Pick<IMetadataTrimResult, "metadataPath" | "metadataBytes">> {
		const arch = options.arch ?? "arm64";
		const base = path.join(
			options.outDir,
			`metadata.${options.platform}.${arch}`,
		);
		const metadataPath = `${base}.nsmd`;
		const sdk = options.sdk ?? this.defaultSdk(options.platform);
		const sdkPath = (
			await this.$childProcess.exec(`xcrun --sdk ${sdk} --show-sdk-path`)
		).trim();
		await this.run(
			this.tool(options.generatorPath, GENERATOR_NAME, "--generator"),
			[
				"-output-bin",
				metadataPath,
				"-output-umbrella",
				`${base}.h`,
				"-whitelist-modules",
				usage.whitelistPath,
				"Xclang",
				"-isysroot",
				sdkPath,
				"-std=gnu99",
				"-target",
				this.targetTriple(options.platform, sdk, arch, options.minVersion),
			],
		);
		return { metadataPath, metadataBytes: fs.statSync(metadataPath).size };
	}

	public async install(
		_usage: IMetadataUsage,
		metadataPath: string | undefined,
		options: IMetadataTrimOptions,
	): Promise<Pick<IMetadataTrimResult, "installedTo" | "replacedBytes">> {
		if (!options.framework || !metadataPath) {
			return {};
		}
		const installedTo = path.join(
			options.outDir,
			path.basename(options.framework),
		);
		fs.rmSync(installedTo, { recursive: true, force: true });
		fs.cpSync(options.framework, installedTo, {
			recursive: true,
			verbatimSymlinks: true,
		});

		const binaryPath = frameworkBinary(installedTo);
		const binary = fs.readFileSync(binaryPath);
		const metadata = fs.readFileSync(metadataPath);

		// The runtime exits at launch on a format it can't read, so a generator
		// that doesn't match the framework has to be caught here.
		const readable = embeddedMetadataVersion(binary);
		const written = metadataFileVersion(metadata);
		if (written === undefined) {
			throw new Error(`${metadataPath} is not NativeScript metadata.`);
		}
		if (readable !== undefined && written > readable) {
			throw new Error(
				`The generator writes metadata format ${written}, but this framework reads format ${readable}. Use the generator from the same runtime release as the framework.`,
			);
		}

		const replaced = replaceEmbeddedMetadata(binary, metadata);
		fs.writeFileSync(binaryPath, replaced);
		await this.run("codesign", [
			"--force",
			"--sign",
			"-",
			"--timestamp=none",
			binaryPath,
		]);
		return { installedTo, replacedBytes: binary.length - replaced.length };
	}

	private tool(explicit: string | undefined, name: string, flag: string) {
		if (!explicit) {
			throw new Error(
				`Pass the path to ${name} from your NativeScript runtime with ${flag}.`,
			);
		}
		return explicit;
	}

	private defaultSdk(platform: string): string {
		return platform === "macos" ? "macosx" : "iphonesimulator";
	}

	private targetTriple(
		platform: string,
		sdk: string,
		arch: string,
		minVersion?: string,
	): string {
		if (platform === "macos") {
			return `${arch}-apple-macos${minVersion ?? "14.0"}`;
		}
		const simulator = sdk.startsWith("iphonesimulator") ? "-simulator" : "";
		return `${arch}-apple-ios${minVersion ?? "15.0"}${simulator}`;
	}

	private async run(command: string, args: string[]): Promise<void> {
		await this.$childProcess.spawnFromEvent(command, args, "close", {
			stdio: "pipe",
		});
	}
}
