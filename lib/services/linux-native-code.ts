import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { IChildProcess, ISpawnResult } from "../common/declarations";

/**
 * Native code of the app (`App_Resources/Linux`) or a plugin (`platforms/linux`):
 *
 *   src/            C / C++ sources (and headers), compiled into lib<name>.so
 *   include/        public headers; when present only these are exposed to JS
 *   lib/<arch>/     prebuilt .so (bundled in lib/) and .a (linked into lib<name>.so)
 *   native.json     { "pkg-config": [], "cflags": [], "libs": [] }
 *
 * Headers are run through the metadata generator into `metadata/<name>.bin`,
 * which the runtime loads next to the SDK metadata.
 *
 * Metadata filters (`native-api-usage.json`, written by prepare as
 * whitelist.mdg / blacklist.mdg) shrink the SDK metadata; units are always
 * kept but honor the blacklist.
 */
export interface LinuxNativeUnit {
	/** module / library name, a C identifier */
	name: string;
	dir: string;
}

export interface LinuxNativeBuildOptions {
	arch: string;
	release: boolean;
	/** output folder: gets lib/ and metadata/ */
	stage: string;
	/** per unit build cache */
	workDir: string;
	/** folder with metadata-generator and lib/clang */
	generatorDir: string;
	/** generated .d.ts go here */
	typingsDir: string;
	/** `module:symbol` patterns excluded from the metadata */
	blacklist?: string;
}

interface NativeConfig {
	"pkg-config"?: string[];
	cflags?: string[];
	libs?: string[];
}

const SOURCE = /\.(c|cc|cpp|cxx)$/;
const CXX_SOURCE = /\.(cc|cpp|cxx)$/;
const HEADER = /\.(h|hh|hpp)$/;
/** App_Resources/Linux entries that are build inputs, not resources */
export const NATIVE_ENTRIES = ["src", "include", "lib", "native.json"];

/** `@scope/my-plugin` -> `scope_my_plugin` */
export function nativeUnitName(name: string): string {
	const id = name.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "_");
	return /^[0-9]/.test(id) ? `_${id}` : id;
}

export function hasNativeCode(dir: string): boolean {
	return NATIVE_ENTRIES.some((e) => fs.existsSync(path.join(dir, e)));
}

function readIfExists(file?: string): string {
	return file && fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function walk(dir: string, filter: RegExp): string[] {
	if (!fs.existsSync(dir)) {
		return [];
	}
	return (fs.readdirSync(dir, { recursive: true }) as string[])
		.filter((f) => filter.test(f))
		.map((f) => path.join(dir, f))
		.sort();
}

export class LinuxNativeCodeBuilder {
	constructor(
		private $childProcess: IChildProcess,
		private $logger: ILogger,
	) {}

	public async build(
		units: LinuxNativeUnit[],
		options: LinuxNativeBuildOptions,
	): Promise<void> {
		for (const unit of units) {
			await this.buildUnit(unit, options);
		}
	}

	private async buildUnit(
		unit: LinuxNativeUnit,
		options: LinuxNativeBuildOptions,
	): Promise<void> {
		const prebuiltDir = path.join(unit.dir, "lib", options.arch);
		const prebuilt = fs.existsSync(prebuiltDir)
			? fs.readdirSync(prebuiltDir).sort()
			: [];
		const shared = prebuilt.filter((f) => /\.so(\.\d+)*$/.test(f));
		const statics = prebuilt
			.filter((f) => f.endsWith(".a"))
			.map((f) => path.join(prebuiltDir, f));
		const sources = walk(path.join(unit.dir, "src"), SOURCE);
		const publicDir = ["include", "src"]
			.map((d) => path.join(unit.dir, d))
			.find((d) => fs.existsSync(d));
		const headers = publicDir ? walk(publicDir, HEADER) : [];
		if (
			!sources.length &&
			!statics.length &&
			!shared.length &&
			!headers.length
		) {
			return;
		}

		const stageLib = path.join(options.stage, "lib");
		fs.mkdirSync(stageLib, { recursive: true });
		for (const file of shared) {
			fs.cpSync(path.join(prebuiltDir, file), path.join(stageLib, file), {
				verbatimSymlinks: true,
			});
		}

		const work = path.join(options.workDir, unit.name);
		const library = `lib${unit.name}.so`;
		const metadata = `${unit.name}.bin`;
		const compiles = sources.length > 0 || statics.length > 0;
		const stamp = path.join(work, "stamp");
		const hash = this.inputsHash(unit.dir, options);
		if (!fs.existsSync(stamp) || fs.readFileSync(stamp, "utf8") !== hash) {
			fs.rmSync(work, { recursive: true, force: true });
			fs.mkdirSync(work, { recursive: true });
			const config = this.config(unit.dir);
			const pkg = config["pkg-config"] ?? [];
			const pkgCflags = pkg.length
				? await this.pkgConfig(["--cflags", ...pkg])
				: [];
			const includes = ["src", "include"]
				.map((d) => path.join(unit.dir, d))
				.filter((d) => fs.existsSync(d))
				.map((d) => `-I${d}`);
			if (compiles) {
				await this.compile(
					unit,
					sources,
					statics,
					shared,
					prebuiltDir,
					[...includes, ...pkgCflags, ...(config.cflags ?? [])],
					pkg,
					config.libs ?? [],
					path.join(work, library),
					options.release,
				);
			}
			if (headers.length) {
				const links = compiles
					? [library]
					: shared.filter(
							(f) => !fs.lstatSync(path.join(prebuiltDir, f)).isSymbolicLink(),
						);
				await this.generate(
					unit,
					publicDir,
					headers,
					links,
					[...includes, ...pkgCflags, ...(config.cflags ?? [])],
					work,
					options,
				);
			}
			fs.writeFileSync(stamp, hash);
		}

		if (compiles) {
			fs.copyFileSync(path.join(work, library), path.join(stageLib, library));
		}
		if (fs.existsSync(path.join(work, metadata))) {
			const stageMetadata = path.join(options.stage, "metadata");
			fs.mkdirSync(stageMetadata, { recursive: true });
			fs.copyFileSync(
				path.join(work, metadata),
				path.join(stageMetadata, metadata),
			);
		}
		const typings = path.join(work, "typings");
		if (fs.existsSync(typings)) {
			fs.mkdirSync(options.typingsDir, { recursive: true });
			fs.cpSync(typings, options.typingsDir, { recursive: true });
		}
	}

	private config(dir: string): NativeConfig {
		const file = path.join(dir, "native.json");
		if (!fs.existsSync(file)) {
			return {};
		}
		try {
			return JSON.parse(fs.readFileSync(file, "utf8"));
		} catch (e) {
			throw new Error(`${file}: ${e.message}`);
		}
	}

	/** Changes to any input (or the generator / build type) rebuild the unit. */
	private inputsHash(dir: string, options: LinuxNativeBuildOptions): string {
		const hash = crypto.createHash("sha1");
		hash.update(`${options.arch}|${options.release}\n`);
		hash.update(readIfExists(options.blacklist));
		const generator = path.join(options.generatorDir, "metadata-generator");
		for (const file of [
			generator,
			...NATIVE_ENTRIES.flatMap((e) => this.files(path.join(dir, e))),
		]) {
			const stat = fs.existsSync(file) && fs.statSync(file);
			hash.update(`${file}|${stat ? `${stat.size}|${stat.mtimeMs}` : "-"}\n`);
		}
		return hash.digest("hex");
	}

	private files(entry: string): string[] {
		if (!fs.existsSync(entry)) {
			return [];
		}
		if (!fs.statSync(entry).isDirectory()) {
			return [entry];
		}
		return (fs.readdirSync(entry, { recursive: true }) as string[])
			.map((f) => path.join(entry, f))
			.sort();
	}

	private async compile(
		unit: LinuxNativeUnit,
		sources: string[],
		statics: string[],
		shared: string[],
		prebuiltDir: string,
		cflags: string[],
		pkg: string[],
		libs: string[],
		output: string,
		release: boolean,
	): Promise<void> {
		const cxx = sources.some((s) => CXX_SOURCE.test(s));
		const driver = cxx ? process.env.CXX || "c++" : process.env.CC || "cc";
		const args = [
			"-shared",
			"-fPIC",
			...(release ? ["-O2"] : ["-O0", "-g"]),
			"-o",
			output,
			`-Wl,-soname,${path.basename(output)}`,
			// bundled libraries sit next to this one
			"-Wl,-rpath,$ORIGIN",
			...cflags,
			...sources,
			...(statics.length
				? ["-Wl,--whole-archive", ...statics, "-Wl,--no-whole-archive"]
				: []),
			...(shared.length
				? [`-L${prebuiltDir}`, ...shared.map((f) => `-l:${f}`)]
				: []),
			...(pkg.length ? await this.pkgConfig(["--libs", ...pkg]) : []),
			...libs,
		];
		this.$logger.info(`Compiling native code: ${unit.name}`);
		await this.run(driver, args, unit.dir);
	}

	private async generate(
		unit: LinuxNativeUnit,
		publicDir: string,
		headers: string[],
		links: string[],
		cflags: string[],
		work: string,
		options: LinuxNativeBuildOptions,
	): Promise<void> {
		const generator = path.join(options.generatorDir, "metadata-generator");
		if (!fs.existsSync(generator)) {
			this.$logger.warn(
				`The metadata generator is not part of this runtime package, ${unit.name}'s C APIs won't be available from JavaScript.`,
			);
			return;
		}
		const gen = path.join(work, "gen");
		fs.mkdirSync(gen, { recursive: true });
		const modulemap = path.join(gen, "module.modulemap");
		fs.writeFileSync(
			modulemap,
			[
				`module ${unit.name} {`,
				`  umbrella "${publicDir}"`,
				...links.map((l) => `  link "${l}"`),
				"}",
				"",
			].join("\n"),
		);
		const umbrella = path.join(gen, "umbrella.h");
		fs.writeFileSync(
			umbrella,
			headers.map((h) => `#include "${h}"\n`).join(""),
		);
		// only this unit's declarations, not the system headers it includes
		const whitelist = path.join(gen, "whitelist.txt");
		fs.writeFileSync(whitelist, `${unit.name}\n`);
		const blacklist =
			options.blacklist && fs.existsSync(options.blacklist)
				? ["-blacklist-modules-file", options.blacklist]
				: [];
		// clang finds its builtin headers relative to the working directory (lib/clang)
		await this.run(
			generator,
			[
				"-input-umbrella",
				umbrella,
				"-whitelist-modules-file",
				whitelist,
				...blacklist,
				"-output-bin",
				path.join(work, `${unit.name}.bin`),
				"-output-typescript",
				path.join(work, "typings"),
				"Xclang",
				`-fmodule-map-file=${modulemap}`,
				...cflags,
			],
			options.generatorDir,
		);
	}

	/**
	 * Copies the SDK metadata to `output`, filtered when there are whitelist /
	 * blacklist files. Reuses the previous result while the inputs match.
	 */
	public async filterMetadata(
		input: string,
		output: string,
		options: {
			toolsDir: string;
			cacheDir: string;
			whitelist: string;
			blacklist: string;
		},
	): Promise<void> {
		const { toolsDir, cacheDir, whitelist, blacklist } = options;
		const filters = [whitelist, blacklist].filter((f) => fs.existsSync(f));
		const tool = path.join(toolsDir, "ns-metadata-filter");
		if (!filters.length || !fs.existsSync(tool)) {
			if (filters.length) {
				this.$logger.warn(
					"This runtime package has no metadata filter, native-api-usage.json is ignored.",
				);
			}
			fs.copyFileSync(input, output);
			return;
		}
		const stat = fs.statSync(input);
		const hash = crypto
			.createHash("sha1")
			.update(`${input}|${stat.size}|${stat.mtimeMs}\n`)
			.update(readIfExists(whitelist))
			.update("\0")
			.update(readIfExists(blacklist))
			.digest("hex");
		const cached = path.join(cacheDir, path.basename(output));
		const stamp = `${cached}.stamp`;
		if (
			!fs.existsSync(cached) ||
			!fs.existsSync(stamp) ||
			fs.readFileSync(stamp, "utf8") !== hash
		) {
			fs.mkdirSync(cacheDir, { recursive: true });
			const args = [input, cached];
			if (fs.existsSync(whitelist)) args.push("--whitelist", whitelist);
			if (fs.existsSync(blacklist)) args.push("--blacklist", blacklist);
			const result = await this.run(tool, args, toolsDir);
			this.$logger.info(`Metadata filtered: ${result.stdout.trim()}`);
			fs.writeFileSync(stamp, hash);
		}
		fs.copyFileSync(cached, output);
	}

	private async pkgConfig(args: string[]): Promise<string[]> {
		const result = await this.run("pkg-config", args, process.cwd());
		return result.stdout.split(/\s+/).filter(Boolean);
	}

	private async run(
		command: string,
		args: string[],
		cwd: string,
	): Promise<ISpawnResult> {
		const result = await this.$childProcess.spawnFromEvent(
			command,
			args,
			"close",
			{ cwd },
			{ throwError: false },
		);
		if (result.exitCode !== 0) {
			throw new Error(
				`${command} failed (exit code ${result.exitCode}):\n${result.stderr || result.stdout}`,
			);
		}
		return result;
	}
}
