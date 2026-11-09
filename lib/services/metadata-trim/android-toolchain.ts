import * as fs from "fs";
import * as path from "path";
import { IChildProcess } from "../../common/declarations";
import {
	IMetadataToolchain,
	IMetadataTrimOptions,
	IMetadataTrimResult,
	IMetadataUsage,
} from "../../definitions/metadata-trim-service";
import { readFilterPatterns } from "./apple-toolchain";

const SEED_SCRIPT = path.join("build-tools", "metadata-filter", "seed.js");
const WHITELIST_NAME = "whitelist.mdg";

/** Android's metadata generator runs in Gradle; this produces its whitelist. */
export class AndroidMetadataToolchain implements IMetadataToolchain {
	public readonly platforms = ["android"];

	constructor(private $childProcess: IChildProcess) {}

	public async analyze(options: IMetadataTrimOptions): Promise<IMetadataUsage> {
		if (!options.androidProject) {
			throw new Error(
				"Pass the Android project that owns whitelist.mdg with --android-project.",
			);
		}
		const project = options.androidProject;
		const whitelistPath = path.join(options.outDir, "whitelist.android.mdg");
		const args = [
			options.analyzerPath ?? path.join(project, SEED_SCRIPT),
			...options.bundles,
			"--out",
			whitelistPath,
			"--manifest",
			path.join(project, "app", "src", "main", "AndroidManifest.xml"),
		];
		const resources = path.join(project, "app", "src", "main", "res");
		if (fs.existsSync(resources)) {
			args.push("--res", resources);
		}
		await this.$childProcess.spawnFromEvent(process.execPath, args, "close", {
			stdio: "pipe",
			// The harvester's parser is installed with the project's build tools.
			env: {
				...process.env,
				NODE_PATH: path.join(
					project,
					"build-tools",
					"jsparser",
					"node_modules",
				),
			},
		});

		// The seed step refuses to write a partial analysis.
		if (!fs.existsSync(whitelistPath)) {
			return { whitelistPath, patternCount: 0, unrestricted: true };
		}
		if (options.keep.length) {
			fs.appendFileSync(whitelistPath, options.keep.join("\n") + "\n");
		}
		const patterns = readFilterPatterns(whitelistPath);
		return {
			whitelistPath,
			patternCount: patterns.length,
			unrestricted: false,
		};
	}

	public async generate(): Promise<
		Pick<IMetadataTrimResult, "metadataPath" | "metadataBytes">
	> {
		return {};
	}

	public async install(
		usage: IMetadataUsage,
		_metadataPath: string | undefined,
		options: IMetadataTrimOptions,
	): Promise<
		Pick<IMetadataTrimResult, "installedTo" | "replacedBytes" | "nextStep">
	> {
		const installedTo = path.join(options.androidProject, WHITELIST_NAME);
		fs.copyFileSync(usage.whitelistPath, installedTo);
		return {
			installedTo,
			// Without this flag Gradle filters by the list as written, dropping
			// the supertypes and signature types the listed classes depend on.
			nextStep:
				"Build with -PnsFilterMetadata so the generator also keeps the types these classes depend on.",
		};
	}
}
