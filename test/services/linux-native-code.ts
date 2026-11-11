import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import {
	LinuxNativeCodeBuilder,
	nativeUnitName,
	hasNativeCode,
	parseModuleMap,
	compileCommandFlags,
} from "../../lib/services/linux-native-code";
import * as stubs from "../stubs";

/**
 * Records commands and fakes their outputs. A CMake build makes `cmakeLibraries`
 * and a compile_commands.json compiling with `cmakeFlags`.
 */
function fakeProcess(
	cmakeLibraries: string[] = [],
	cmakeFlags = "-I../inc -DMASON_API=1",
) {
	const calls: { command: string; args: string[]; cwd: string }[] = [];
	const cmakeOutputs = new Map<string, string>();
	return {
		calls,
		spawnFromEvent: async (
			command: string,
			args: string[],
			_event: string,
			options: any,
		) => {
			calls.push({ command, args, cwd: options.cwd });
			const output = (flag: string) => args[args.indexOf(flag) + 1];
			if (command === "pkg-config") {
				return {
					exitCode: 0,
					stdout:
						args[0] === "--cflags"
							? "-I/usr/include/glib-2.0\n"
							: "-lglib-2.0\n",
					stderr: "",
				};
			}
			if (command === "cmake") {
				if (args[0] === "-S") {
					const build = output("-B");
					const define = "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=";
					cmakeOutputs.set(
						build,
						args.find((a) => a.startsWith(define)).slice(define.length),
					);
					fs.mkdirSync(build, { recursive: true });
					fs.writeFileSync(
						path.join(build, "compile_commands.json"),
						JSON.stringify([
							{
								directory: build,
								command: `cc ${cmakeFlags} -c mason.c`,
								file: "mason.c",
							},
						]),
					);
				} else {
					const out = cmakeOutputs.get(args[1]);
					fs.mkdirSync(out, { recursive: true });
					for (const library of cmakeLibraries) {
						fs.writeFileSync(path.join(out, library), "elf");
					}
				}
				return { exitCode: 0, stdout: "", stderr: "" };
			}
			if (command.endsWith("ns-metadata-filter")) {
				fs.writeFileSync(args[1], "filtered");
				return { exitCode: 0, stdout: "1 of 2 declarations", stderr: "" };
			}
			if (command.endsWith("metadata-generator")) {
				fs.writeFileSync(output("-output-bin"), "bin");
				fs.mkdirSync(output("-output-typescript"), { recursive: true });
				fs.writeFileSync(
					path.join(output("-output-typescript"), "c!app.d.ts"),
					"",
				);
			} else {
				fs.writeFileSync(output("-o"), "elf");
			}
			return { exitCode: 0, stdout: "", stderr: "" };
		},
	};
}

describe("linuxNativeCode", () => {
	let root: string;
	let options: any;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "ns-linux-native-"));
		const generatorDir = path.join(root, "tools");
		fs.mkdirSync(generatorDir);
		fs.writeFileSync(path.join(generatorDir, "metadata-generator"), "");
		options = {
			arch: "x64",
			release: false,
			stage: path.join(root, "stage"),
			workDir: path.join(root, "work"),
			generatorDir,
			typingsDir: path.join(root, "typings"),
		};
	});

	afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

	function unit(files: Record<string, string>) {
		const dir = path.join(root, "Linux");
		for (const [file, content] of Object.entries(files)) {
			fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
			fs.writeFileSync(path.join(dir, file), content);
		}
		return { name: "app", dir };
	}

	it("names units after plugins", () => {
		assert.equal(
			nativeUnitName("@nativescript/my-plugin"),
			"nativescript_my_plugin",
		);
		assert.equal(nativeUnitName("3d"), "_3d");
	});

	it("compiles sources, generates metadata and stages both", async () => {
		const app = unit({
			"src/hello.c": "int f(void);",
			"src/hello.h": "int f(void);",
			"native.json": '{"pkg-config":["glib-2.0"],"libs":["-lm"]}',
		});
		assert.isTrue(hasNativeCode(app.dir));
		const proc = fakeProcess();
		await new LinuxNativeCodeBuilder(<any>proc, new stubs.LoggerStub()).build(
			[app],
			options,
		);

		const cc = proc.calls.find((c) => c.command === "cc");
		assert.includeMembers(cc.args, [
			"-shared",
			"-fPIC",
			"-Wl,-soname,libapp.so",
			"-I/usr/include/glib-2.0",
			"-lglib-2.0",
			"-lm",
			path.join(app.dir, "src/hello.c"),
		]);
		const generator = proc.calls.find((c) =>
			c.command.endsWith("metadata-generator"),
		);
		assert.equal(generator.cwd, options.generatorDir);
		const modulemap = fs.readFileSync(
			path.join(options.workDir, "app/gen/module.modulemap"),
			"utf8",
		);
		assert.include(modulemap, `umbrella "${path.join(app.dir, "src")}"`);
		assert.include(modulemap, 'link "libapp.so"');

		assert.isTrue(fs.existsSync(path.join(options.stage, "lib/libapp.so")));
		assert.isTrue(fs.existsSync(path.join(options.stage, "metadata/app.bin")));
		assert.isTrue(fs.existsSync(path.join(options.typingsDir, "c!app.d.ts")));
	});

	it("reuses the previous build when nothing changed", async () => {
		const app = unit({ "src/hello.c": "", "src/hello.h": "" });
		const proc = fakeProcess();
		const builder = new LinuxNativeCodeBuilder(
			<any>proc,
			new stubs.LoggerStub(),
		);
		await builder.build([app], options);
		const count = proc.calls.length;
		fs.rmSync(options.stage, { recursive: true });
		await builder.build([app], options);
		assert.equal(proc.calls.length, count);
		assert.isTrue(fs.existsSync(path.join(options.stage, "lib/libapp.so")));
	});

	it("bundles prebuilt shared libraries and links them from public headers", async () => {
		const app = unit({
			"include/foo.h": "void foo(void);",
			"lib/x64/libfoo.so.1": "elf",
			"lib/arm64/libfoo.so.1": "elf",
		});
		const proc = fakeProcess();
		await new LinuxNativeCodeBuilder(<any>proc, new stubs.LoggerStub()).build(
			[app],
			options,
		);
		assert.isUndefined(proc.calls.find((c) => c.command === "cc"));
		assert.deepEqual(fs.readdirSync(path.join(options.stage, "lib")), [
			"libfoo.so.1",
		]);
		const modulemap = fs.readFileSync(
			path.join(options.workDir, "app/gen/module.modulemap"),
			"utf8",
		);
		assert.include(modulemap, `umbrella "${path.join(app.dir, "include")}"`);
		assert.include(modulemap, 'link "libfoo.so.1"');
	});

	it("copies SDK metadata unless there are filters", async () => {
		const input = path.join(root, "metadata-x86_64.bin");
		fs.writeFileSync(input, "sdk");
		fs.writeFileSync(path.join(options.generatorDir, "ns-metadata-filter"), "");
		const filterOptions = {
			toolsDir: options.generatorDir,
			cacheDir: path.join(root, "cache"),
			whitelist: path.join(root, "whitelist.mdg"),
			blacklist: path.join(root, "blacklist.mdg"),
		};
		const proc = fakeProcess();
		const builder = new LinuxNativeCodeBuilder(
			<any>proc,
			new stubs.LoggerStub(),
		);
		const output = path.join(root, "out.bin");

		await builder.filterMetadata(input, output, filterOptions);
		assert.equal(fs.readFileSync(output, "utf8"), "sdk");
		assert.lengthOf(proc.calls, 0);

		fs.writeFileSync(filterOptions.whitelist, "Gtk:gtk_*");
		await builder.filterMetadata(input, output, filterOptions);
		assert.lengthOf(proc.calls, 1);
		assert.deepEqual(proc.calls[0].args.slice(2), [
			"--whitelist",
			filterOptions.whitelist,
		]);
		// same inputs reuse the filtered file
		await builder.filterMetadata(input, output, filterOptions);
		assert.lengthOf(proc.calls, 1);
	});

	it("passes the blacklist to the generator", async () => {
		const app = unit({ "include/foo.h": "void foo(void);" });
		const blacklist = path.join(root, "blacklist.mdg");
		fs.writeFileSync(blacklist, "app:foo_private*");
		const proc = fakeProcess();
		await new LinuxNativeCodeBuilder(<any>proc, new stubs.LoggerStub()).build(
			[app],
			{ ...options, blacklist },
		);
		const generator = proc.calls.find((c) =>
			c.command.endsWith("metadata-generator"),
		);
		assert.include(generator.args, "-blacklist-modules-file");
		assert.include(generator.args, blacklist);
	});

	it("parses the parts of a module map the generator needs", () => {
		const outside = path.join(root, "outside.h");
		const app = unit({
			"include/module.modulemap": `
				// comment: module ignored { header "no.h" }
				module mason [system] {
					umbrella header "mason.h"
					private header "detail/private.h"
					textual header "textual.h"
					exclude header "excluded.h"
					header "${outside}"
					link "mason"
					explicit module ui { header "ui.h" link framework "x" }
				}
				extern module other "other.modulemap"
				module extra { umbrella "extra" }
			`,
			"include/extra/a.h": "",
			"include/extra/b/c.h": "",
		});
		const info = parseModuleMap(path.join(app.dir, "include/module.modulemap"));
		const include = path.join(app.dir, "include");
		assert.deepEqual(info.modules, ["mason", "extra"]);
		assert.deepEqual(info.links, ["mason", "x"]);
		assert.deepEqual(info.headers, [
			path.join(include, "mason.h"),
			path.join(include, "detail/private.h"),
			outside,
			path.join(include, "ui.h"),
			path.join(include, "extra/a.h"),
			path.join(include, "extra/b/c.h"),
		]);
	});

	it("uses the unit's module map and builds the library it links", async () => {
		const app = unit({
			"src/module.modulemap":
				'module mason [system] {\n  header "mason.h"\n  link "mason"\n}\n',
			"src/mason.h": "int mason(void);",
			"src/internal.h": "int internal(void);",
			"src/mason.c": "int mason(void) { return 1; }",
		});
		const proc = fakeProcess();
		await new LinuxNativeCodeBuilder(<any>proc, new stubs.LoggerStub()).build(
			[app],
			options,
		);

		const cc = proc.calls.find((c) => c.command === "cc");
		assert.include(cc.args, "-Wl,-soname,libmason.so");
		assert.isTrue(fs.existsSync(path.join(options.stage, "lib/libmason.so")));
		assert.isFalse(fs.existsSync(path.join(options.stage, "lib/libapp.so")));

		const generator = proc.calls.find((c) =>
			c.command.endsWith("metadata-generator"),
		);
		assert.include(
			generator.args,
			`-fmodule-map-file=${path.join(app.dir, "src/module.modulemap")}`,
		);
		assert.isFalse(
			fs.existsSync(path.join(options.workDir, "app/gen/module.modulemap")),
		);
		assert.equal(
			fs.readFileSync(path.join(options.workDir, "app/gen/umbrella.h"), "utf8"),
			`#include "${path.join(app.dir, "src/mason.h")}"\n`,
		);
		assert.equal(
			fs.readFileSync(
				path.join(options.workDir, "app/gen/whitelist.txt"),
				"utf8",
			),
			"mason\nmason.*\n",
		);
		assert.isTrue(fs.existsSync(path.join(options.stage, "metadata/app.bin")));
	});

	it("wraps a library from a module map without sources", async () => {
		const outside = path.join(root, "sqlite3.h");
		fs.writeFileSync(outside, "int sqlite3_open(void);");
		const app = unit({
			"src/module.modulemap": `module sqlite3 [system] {\n  header "${outside}"\n  link "sqlite3"\n}\n`,
		});
		const proc = fakeProcess();
		const builder = new LinuxNativeCodeBuilder(
			<any>proc,
			new stubs.LoggerStub(),
		);
		await builder.build([app], options);
		assert.isUndefined(proc.calls.find((c) => c.command === "cc"));
		assert.equal(
			fs.readFileSync(path.join(options.workDir, "app/gen/umbrella.h"), "utf8"),
			`#include "${outside}"\n`,
		);

		// headers outside the unit are build inputs too
		const count = proc.calls.length;
		await builder.build([app], options);
		assert.equal(proc.calls.length, count);
		fs.writeFileSync(
			outside,
			"int sqlite3_open(void); int sqlite3_close(void);",
		);
		await builder.build([app], options);
		assert.isAbove(proc.calls.length, count);
	});

	it("warns when a module map doesn't link the compiled sources", async () => {
		const app = unit({
			"src/module.modulemap": 'module mason {\n  header "mason.h"\n}\n',
			"src/mason.h": "int mason(void);",
			"src/mason.c": "int mason(void) { return 1; }",
		});
		const warnings: string[] = [];
		const logger = new stubs.LoggerStub();
		logger.warn = (...args: any[]) => {
			warnings.push(args.join(" "));
		};
		await new LinuxNativeCodeBuilder(<any>fakeProcess(), logger).build(
			[app],
			options,
		);
		assert.lengthOf(warnings, 1);
		assert.include(warnings[0], 'link "app"');
		assert.isTrue(fs.existsSync(path.join(options.stage, "lib/libapp.so")));
	});

	it("reads include paths and defines from compile_commands.json", () => {
		const file = path.join(root, "compile_commands.json");
		fs.writeFileSync(
			file,
			JSON.stringify([
				{
					directory: "/build",
					command:
						'cc -I../inc -I /abs -isystem "/with space" \'-DNAME="a b"\' -D X=1 -UOLD -O2 -o x.o -c x.c',
					file: "x.c",
				},
				{
					directory: "/build",
					arguments: ["c++", "-I../inc", "-iquote", "q", "-c", "y.cc"],
					file: "y.cc",
				},
			]),
		);
		assert.deepEqual(compileCommandFlags(file), [
			"-I/inc",
			"-I/abs",
			"-isystem",
			"/with space",
			'-DNAME="a b"',
			"-DX=1",
			"-UOLD",
			"-iquote",
			"/build/q",
		]);
		assert.deepEqual(compileCommandFlags(path.join(root, "missing.json")), []);
	});

	it("builds a CMake project and bundles the libraries it builds", async () => {
		const app = unit({
			"CMakeLists.txt": "add_library(mason SHARED src/mason.c)",
			"src/mason.c": "int mason(void) { return 1; }",
			"src/mason.h": "int mason(void);",
			"src/module.modulemap":
				'module mason {\n  header "mason.h"\n  link "mason"\n}\n',
		});
		assert.isTrue(hasNativeCode(app.dir));
		const proc = fakeProcess(["libmason.so"]);
		const builder = new LinuxNativeCodeBuilder(
			<any>proc,
			new stubs.LoggerStub(),
		);
		await builder.build([app], options);

		assert.isUndefined(proc.calls.find((c) => c.command === "cc"));
		const configure = proc.calls.find(
			(c) => c.command === "cmake" && c.args[0] === "-S",
		);
		const build = path.join(options.workDir, "app.cmake/debug");
		assert.includeMembers(configure.args, [
			app.dir,
			build,
			"-DCMAKE_BUILD_TYPE=Debug",
			"-DCMAKE_EXPORT_COMPILE_COMMANDS=ON",
			"-DNS_ARCH=x64",
		]);
		assert.deepEqual(fs.readdirSync(path.join(options.stage, "lib")), [
			"libmason.so",
		]);
		const generator = proc.calls.find((c) =>
			c.command.endsWith("metadata-generator"),
		);
		assert.includeMembers(generator.args, [
			`-I${path.resolve(build, "../inc")}`,
			"-DMASON_API=1",
			`-fmodule-map-file=${path.join(app.dir, "src/module.modulemap")}`,
		]);

		// CMake runs on every build and decides itself; the metadata is reused
		const generated = proc.calls.filter((c) =>
			c.command.endsWith("metadata-generator"),
		).length;
		await builder.build([app], { ...options });
		assert.lengthOf(
			proc.calls.filter(
				(c) => c.command === "cmake" && c.args[0] === "--build",
			),
			2,
		);
		assert.lengthOf(
			proc.calls.filter((c) => c.command.endsWith("metadata-generator")),
			generated,
		);
		// the CMake build folder survives a metadata rebuild
		assert.isTrue(fs.existsSync(path.join(build, "compile_commands.json")));
	});

	it("links a CMake project's libraries from a generated module map", async () => {
		const app = unit({
			"CMakeLists.txt": "add_library(foo SHARED foo.c)",
			"include/foo.h": "void foo(void);",
		});
		const proc = fakeProcess(["libfoo.so"]);
		await new LinuxNativeCodeBuilder(<any>proc, new stubs.LoggerStub()).build(
			[app],
			{ ...options, release: true },
		);
		const configure = proc.calls.find(
			(c) => c.command === "cmake" && c.args[0] === "-S",
		);
		assert.include(configure.args, "-DCMAKE_BUILD_TYPE=Release");
		const modulemap = fs.readFileSync(
			path.join(options.workDir, "app/gen/module.modulemap"),
			"utf8",
		);
		assert.include(modulemap, 'link "libfoo.so"');
		assert.isTrue(fs.existsSync(path.join(options.stage, "lib/libfoo.so")));
	});
});
