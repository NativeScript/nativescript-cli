import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { IChildProcess, ISpawnResult } from "../common/declarations";

/**
 * Native code of the app (`App_Resources/Linux`) or a plugin (`platforms/linux`):
 *
 *   src/            C / C++ sources (and headers), compiled into lib<name>.so
 *   include/        public headers; when present only these are exposed to JS
 *   lib/<arch>/     prebuilt .so / .node (bundled in lib/) and .a (linked into lib<name>.so)
 *   native.json     { "pkg-config": [], "cflags": [], "libs": [] }
 *   CMakeLists.txt  builds the unit instead of src/; its shared libraries go in lib/
 *
 * Headers are run through the metadata generator into `metadata/<name>.bin`,
 * which the runtime loads next to the SDK metadata.
 *
 * A `module.modulemap` in src/ or include/ is used as is, like on iOS. Without
 * one, the unit is a module named after it.
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
const MODULE_MAP = /(^|[\\/])module\.modulemap$/;
/** App_Resources/Linux entries that are build inputs, not resources */
export const NATIVE_ENTRIES = [
	"src",
	"include",
	"lib",
	"native.json",
	"CMakeLists.txt",
];
const CMAKE_LISTS = "CMakeLists.txt";
const SHARED_LIBRARY = /\.(so(\.\d+)*|node)$/;

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

export interface ModuleMapInfo {
	file: string;
	modules: string[];
	headers: string[];
	links: string[];
}

// clang parses the map itself, this only needs the headers for the umbrella
export function parseModuleMap(file: string): ModuleMapInfo {
	const dir = path.dirname(file);
	const text = fs
		.readFileSync(file, "utf8")
		.replace(/\/\*[\s\S]*?\*\//g, " ")
		.replace(/\/\/[^\n]*/g, " ");
	const tokens = text.match(/"(?:[^"\\]|\\.)*"|[{}]|[A-Za-z_][\w.]*|\*/g) ?? [];
	const unquote = (t?: string) =>
		t && t.startsWith('"') ? t.slice(1, -1) : undefined;
	const info: ModuleMapInfo = { file, modules: [], headers: [], links: [] };
	let depth = 0;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === "{") {
			depth++;
		} else if (token === "}") {
			depth--;
		} else if (
			token === "module" &&
			depth === 0 &&
			tokens[i - 1] !== "extern"
		) {
			const name = tokens[i + 1];
			if (name && /^[A-Za-z_]\w*$/.test(name)) {
				info.modules.push(name);
			}
		} else if (token === "header") {
			const header = unquote(tokens[i + 1]);
			const qualifiers = [tokens[i - 1], tokens[i - 2]];
			if (
				header &&
				!qualifiers.includes("exclude") &&
				!qualifiers.includes("textual")
			) {
				info.headers.push(path.resolve(dir, header));
			}
		} else if (token === "umbrella") {
			const umbrella = unquote(tokens[i + 1]);
			if (umbrella) {
				info.headers.push(...walk(path.resolve(dir, umbrella), HEADER));
			}
		} else if (token === "link") {
			const name = unquote(
				tokens[i + 1] === "framework" ? tokens[i + 2] : tokens[i + 1],
			);
			if (name) {
				info.links.push(name);
			}
		}
	}
	return info;
}

function shellSplit(command: string): string[] {
	const args: string[] = [];
	let current = "";
	let started = false;
	let quote: string | null = null;
	for (let i = 0; i < command.length; i++) {
		const c = command[i];
		if (quote) {
			if (c === quote) {
				quote = null;
			} else if (c === "\\" && quote === '"' && i + 1 < command.length) {
				current += command[++i];
			} else {
				current += c;
			}
		} else if (c === "'" || c === '"') {
			quote = c;
			started = true;
		} else if (c === "\\" && i + 1 < command.length) {
			current += command[++i];
			started = true;
		} else if (/\s/.test(c)) {
			if (started) {
				args.push(current);
			}
			current = "";
			started = false;
		} else {
			current += c;
			started = true;
		}
	}
	if (started) {
		args.push(current);
	}
	return args;
}

export function compileCommandFlags(file: string): string[] {
	if (!fs.existsSync(file)) {
		return [];
	}
	const entries: {
		directory: string;
		command?: string;
		arguments?: string[];
	}[] = JSON.parse(fs.readFileSync(file, "utf8"));
	const flags = new Map<string, string[]>();
	const add = (...flag: string[]) => flags.set(flag.join("\0"), flag);
	for (const entry of entries) {
		const args = entry.arguments ?? shellSplit(entry.command ?? "");
		const resolve = (dir: string) => path.resolve(entry.directory, dir);
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			const option = ["-I", "-isystem", "-iquote", "-idirafter"].find((o) =>
				arg.startsWith(o),
			);
			if (option) {
				const dir =
					arg.length > option.length ? arg.slice(option.length) : args[++i];
				if (dir) {
					if (option === "-I") {
						add(`-I${resolve(dir)}`);
					} else {
						add(option, resolve(dir));
					}
				}
			} else if (arg === "-D" || arg === "-U") {
				if (args[i + 1]) {
					add(`${arg}${args[++i]}`);
				}
			} else if (arg.startsWith("-D") || arg.startsWith("-U")) {
				add(arg);
			}
		}
	}
	return [...flags.values()].flat();
}

/**
 * `index.d.ts` for an app's `typings/linux`: the SDK typings in `sdk/` and
 * the native code typings (`c!<unit>.d.ts`) next to it.
 */
export function writeTypingsIndex(dir: string): void {
	const references = [
		...(fs.existsSync(path.join(dir, "sdk", "index.d.ts"))
			? ["./sdk/index.d.ts"]
			: []),
		...fs
			.readdirSync(dir)
			.filter((f) => f.startsWith("c!") && f.endsWith(".d.ts"))
			.sort()
			.map((f) => `./${f}`),
	];
	fs.writeFileSync(
		path.join(dir, "index.d.ts"),
		references.map((r) => `/// <reference path="${r}" />\n`).join(""),
	);
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
		// Node-API addons (.node) are shared libraries too, loaded by path from lib/
		const bundled = new Map(
			prebuilt
				.filter((f) => SHARED_LIBRARY.test(f))
				.map((f) => [f, path.join(prebuiltDir, f)]),
		);
		const cmake = fs.existsSync(path.join(unit.dir, CMAKE_LISTS));
		const statics = prebuilt
			.filter((f) => f.endsWith(".a"))
			.map((f) => path.join(prebuiltDir, f));
		const sources = cmake ? [] : walk(path.join(unit.dir, "src"), SOURCE);
		const publicDir = ["include", "src"]
			.map((d) => path.join(unit.dir, d))
			.find((d) => fs.existsSync(d));
		const maps = ["include", "src"]
			.flatMap((d) => walk(path.join(unit.dir, d), MODULE_MAP))
			.map(parseModuleMap);
		const headers = maps.length
			? [...new Set(maps.flatMap((m) => m.headers))]
			: publicDir
				? walk(publicDir, HEADER)
				: [];
		if (
			!cmake &&
			!sources.length &&
			!statics.length &&
			!bundled.size &&
			!headers.length
		) {
			return;
		}

		const cmakeBuild = cmake
			? await this.cmake(unit, options)
			: { libraries: [], cflags: [] };
		for (const library of cmakeBuild.libraries) {
			bundled.set(path.basename(library), library);
		}
		const shared = [...bundled.keys()].sort();

		const stageLib = path.join(options.stage, "lib");
		fs.mkdirSync(stageLib, { recursive: true });
		for (const [file, from] of bundled) {
			fs.cpSync(from, path.join(stageLib, file), {
				verbatimSymlinks: true,
			});
		}

		const work = path.join(options.workDir, unit.name);
		const compiles = !cmake && (sources.length > 0 || statics.length > 0);
		const library = compiles
			? this.libraryName(unit, maps, shared)
			: `lib${unit.name}.so`;
		const metadata = `${unit.name}.bin`;
		const stamp = path.join(work, "stamp");
		// headers a module map exposes from outside the unit
		const hash = this.inputsHash(unit.dir, options, [
			...maps.flatMap((m) => m.headers),
			library,
			...shared,
			...cmakeBuild.cflags,
		]);
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
							(f) => !fs.lstatSync(bundled.get(f)).isSymbolicLink(),
						);
				await this.generate(
					unit,
					publicDir,
					maps,
					headers,
					links,
					[
						...includes,
						...cmakeBuild.cflags,
						...pkgCflags,
						...(config.cflags ?? []),
					],
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

	private async cmake(
		unit: LinuxNativeUnit,
		options: LinuxNativeBuildOptions,
	): Promise<{ libraries: string[]; cflags: string[] }> {
		// outside the work folder, which is wiped when inputs change, so CMake stays incremental
		const build = path.join(
			options.workDir,
			`${unit.name}.cmake`,
			options.release ? "release" : "debug",
		);
		const output = path.join(build, "ns-lib");
		this.$logger.info(`Building native code with CMake: ${unit.name}`);
		await this.run(
			"cmake",
			[
				"-S",
				unit.dir,
				"-B",
				build,
				`-DCMAKE_BUILD_TYPE=${options.release ? "Release" : "Debug"}`,
				`-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=${output}`,
				"-DCMAKE_EXPORT_COMPILE_COMMANDS=ON",
				// bundled libraries sit next to each other in lib/
				"-DCMAKE_BUILD_RPATH=$ORIGIN",
				`-DNS_ARCH=${options.arch}`,
			],
			unit.dir,
		);
		await this.run("cmake", ["--build", build, "--parallel"], unit.dir);
		const libraries = fs.existsSync(output)
			? fs
					.readdirSync(output)
					.filter((f) => SHARED_LIBRARY.test(f))
					.sort()
					.map((f) => path.join(output, f))
			: [];
		if (!libraries.length) {
			this.$logger.warn(
				`${path.join(unit.dir, CMAKE_LISTS)} built no shared library (add_library(<name> SHARED ...)), ${unit.name}'s C functions won't load.`,
			);
		}
		return {
			libraries,
			cflags: compileCommandFlags(path.join(build, "compile_commands.json")),
		};
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

	// the runtime only loads libraries a module links, so sources are built as one of them
	private libraryName(
		unit: LinuxNativeUnit,
		maps: ModuleMapInfo[],
		bundled: string[],
	): string {
		const fallback = `lib${unit.name}.so`;
		if (!maps.length) {
			return fallback;
		}
		const isBundled = (link: string) =>
			bundled.some(
				(f) =>
					f === link || f === `lib${link}.so` || f.startsWith(`lib${link}.so.`),
			);
		for (const link of maps.flatMap((m) => m.links)) {
			if (isBundled(link)) {
				continue;
			}
			if (/^lib[^/]+\.so$/.test(link)) {
				return link;
			}
			if (/^[\w+-]+$/.test(link)) {
				return `lib${link}.so`;
			}
		}
		this.$logger.warn(
			`${maps[0].file} doesn't link a library for ${unit.name}'s sources, so their functions won't load. Add \`link "${unit.name}"\` to the module.`,
		);
		return fallback;
	}

	/** Changes to any input (or the generator / build type) rebuild the unit. */
	private inputsHash(
		dir: string,
		options: LinuxNativeBuildOptions,
		extra: string[] = [],
	): string {
		const hash = crypto.createHash("sha1");
		hash.update(`${options.arch}|${options.release}\n`);
		hash.update(readIfExists(options.blacklist));
		const generator = path.join(options.generatorDir, "metadata-generator");
		for (const file of [
			generator,
			...NATIVE_ENTRIES.flatMap((e) => this.files(path.join(dir, e))),
			...extra,
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
		maps: ModuleMapInfo[],
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
		let modulemaps = maps.map((m) => m.file);
		let modules = maps.flatMap((m) => m.modules);
		if (!maps.length) {
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
			modulemaps = [modulemap];
			modules = [unit.name];
		}
		const umbrella = path.join(gen, "umbrella.h");
		fs.writeFileSync(
			umbrella,
			headers.map((h) => `#include "${h}"\n`).join(""),
		);
		// only this unit's declarations, not the system headers it includes
		const whitelist = path.join(gen, "whitelist.txt");
		fs.writeFileSync(whitelist, modules.map((m) => `${m}\n${m}.*\n`).join(""));
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
				...modulemaps.map((m) => `-fmodule-map-file=${m}`),
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
		let result: ISpawnResult;
		try {
			result = await this.$childProcess.spawnFromEvent(
				command,
				args,
				"close",
				{ cwd },
				{ throwError: false },
			);
		} catch (e) {
			if (e?.code === "ENOENT") {
				throw new Error(
					`${command} was not found, install it to build Linux native code (sudo apt install ${command === "cmake" ? "cmake" : "build-essential"}).`,
				);
			}
			throw e;
		}
		if (result.exitCode !== 0) {
			throw new Error(
				`${command} failed (exit code ${result.exitCode}):\n${result.stderr || result.stdout}`,
			);
		}
		return result;
	}
}
