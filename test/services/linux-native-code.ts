import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import {
	LinuxNativeCodeBuilder,
	nativeUnitName,
	hasNativeCode,
} from "../../lib/services/linux-native-code";
import * as stubs from "../stubs";

/** Records commands and fakes their outputs. */
function fakeProcess() {
	const calls: { command: string; args: string[]; cwd: string }[] = [];
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
});
