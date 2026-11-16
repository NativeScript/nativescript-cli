import { assert } from "chai";
import * as path from "path";
import { mkdtempSync, statSync, utimesSync } from "fs";
import { tmpdir } from "os";
import { Yok } from "../../../lib/common/yok";
import { FileSystem } from "../../../lib/common/file-system";
import { AndroidPluginMirrorService } from "../../../lib/services/android/android-plugin-mirror-service";
import { IFileSystem } from "../../../lib/common/declarations";
import { IAndroidPluginMirror } from "../../../lib/definitions/android-plugin-migrator";
import * as stubs from "../../stubs";

describe("androidPluginMirrorService", () => {
	let fs: IFileSystem;
	let mirrorService: AndroidPluginMirrorService;
	let packageDir: string;
	let mirrorsRoot: string;
	let mirror: IAndroidPluginMirror;

	const upstream = (...parts: string[]) => path.join(packageDir, ...parts);
	const mirrored = (...parts: string[]) =>
		path.join(mirror.mirrorDir, ...parts);
	const mtimeOf = (file: string) => statSync(file).mtime.getTime();
	const setMtime = (file: string, seconds: number) =>
		utimesSync(file, seconds, seconds);

	beforeEach(() => {
		const injector = new Yok();
		injector.register("injector", injector);
		injector.register("fs", FileSystem);
		injector.register("logger", stubs.LoggerStub);
		injector.register("androidPluginMirrorService", AndroidPluginMirrorService);
		fs = injector.resolve("fs");
		mirrorService = injector.resolve("androidPluginMirrorService");

		const root = mkdtempSync(path.join(tmpdir(), "plugin-mirror-"));
		packageDir = path.join(root, "node_modules", "@foo", "plugin-x");
		mirrorsRoot = path.join(root, "platforms", "android", ".ns-plugins");
		mirror = {
			pluginName: "@foo/plugin-x",
			packageDir,
			mirrorDir: path.join(mirrorsRoot, "foo_plugin_x"),
			excludedNativeFiles: ["plugin_x.aar"],
		};

		fs.writeJson(upstream("package.json"), { name: "@foo/plugin-x" });
		fs.writeFile(upstream("README.md"), "not mirrored");
		fs.writeFile(upstream("platforms", "android", "include.gradle"), "a");
		fs.writeFile(upstream("platforms", "android", "libs", "x.jar"), "jar");
		fs.writeFile(upstream("platforms", "android", "plugin_x.aar"), "stale");
		fs.writeFile(upstream("platforms", "ios", "Podfile"), "not mirrored");
		for (const file of [
			upstream("package.json"),
			upstream("platforms", "android", "include.gradle"),
			upstream("platforms", "android", "libs", "x.jar"),
		]) {
			setMtime(file, 1_000_000);
		}
	});

	it("copies package.json and platforms/android, keeping upstream mtimes", () => {
		assert.deepStrictEqual(mirrorService.syncMirrors(mirrorsRoot, [mirror]), [
			"@foo/plugin-x",
		]);

		assert.deepStrictEqual(fs.readJson(mirrored("package.json")), {
			name: "@foo/plugin-x",
		});
		assert.equal(
			fs.readText(mirrored("platforms", "android", "include.gradle")),
			"a",
		);
		assert.equal(
			fs.readText(mirrored("platforms", "android", "libs", "x.jar")),
			"jar",
		);
		assert.equal(
			mtimeOf(mirrored("platforms", "android", "libs", "x.jar")),
			1_000_000_000,
		);
		assert.isFalse(fs.exists(mirrored("README.md")));
		assert.isFalse(fs.exists(mirrored("platforms", "ios")));
		assert.isFalse(fs.exists(mirrored("platforms", "android", "plugin_x.aar")));
	});

	it("only rewrites files whose upstream content changed", () => {
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		fs.writeFile(
			mirrored("platforms", "android", "include.gradle"),
			"rewritten by the CLI",
		);
		setMtime(upstream("package.json"), 2_000_000);

		assert.deepStrictEqual(
			mirrorService.syncMirrors(mirrorsRoot, [mirror]),
			[],
		);
		assert.equal(mtimeOf(mirrored("package.json")), 1_000_000_000);
		assert.equal(
			fs.readText(mirrored("platforms", "android", "include.gradle")),
			"rewritten by the CLI",
		);

		fs.writeFile(upstream("platforms", "android", "include.gradle"), "b");
		setMtime(upstream("platforms", "android", "include.gradle"), 3_000_000);

		assert.deepStrictEqual(mirrorService.syncMirrors(mirrorsRoot, [mirror]), [
			"@foo/plugin-x",
		]);
		assert.equal(
			fs.readText(mirrored("platforms", "android", "include.gradle")),
			"b",
		);
		assert.equal(
			mtimeOf(mirrored("platforms", "android", "include.gradle")),
			3_000_000_000,
		);
		assert.equal(
			mtimeOf(mirrored("platforms", "android", "libs", "x.jar")),
			1_000_000_000,
		);
	});

	it("restores a mirrored file that was deleted", () => {
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		fs.deleteFile(mirrored("platforms", "android", "libs", "x.jar"));

		assert.deepStrictEqual(mirrorService.syncMirrors(mirrorsRoot, [mirror]), [
			"@foo/plugin-x",
		]);
		assert.equal(
			fs.readText(mirrored("platforms", "android", "libs", "x.jar")),
			"jar",
		);
	});

	it("deletes files removed upstream but keeps files the CLI added", () => {
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		fs.writeFile(mirrored("platforms", "android", "foo_plugin_x.aar"), "built");
		fs.deleteDirectory(upstream("platforms", "android", "libs"));

		assert.deepStrictEqual(mirrorService.syncMirrors(mirrorsRoot, [mirror]), [
			"@foo/plugin-x",
		]);
		assert.isFalse(fs.exists(mirrored("platforms", "android", "libs")));
		assert.equal(
			fs.readText(mirrored("platforms", "android", "foo_plugin_x.aar")),
			"built",
		);
	});

	it("recopies a file whose content changed without changing its size or mtime", () => {
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		const includeGradle = upstream("platforms", "android", "include.gradle");
		fs.writeFile(includeGradle, "b");
		setMtime(includeGradle, 1_000_000);

		const changed = mirrorService.syncMirrors(mirrorsRoot, [mirror]);

		assert.deepStrictEqual(changed, ["@foo/plugin-x"]);
		assert.equal(
			fs.readText(mirrored("platforms", "android", "include.gradle")),
			"b",
		);
	});

	it("removes the mirrors of plugins that are gone", () => {
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		assert.isTrue(fs.exists(mirror.mirrorDir));

		mirrorService.syncMirrors(mirrorsRoot, []);

		assert.isFalse(fs.exists(mirror.mirrorDir));
		assert.isTrue(fs.exists(packageDir));
	});

	it("never writes into the package", () => {
		const before = fs.enumerateFilesInDirectorySync(packageDir).map((file) => ({
			file,
			content: fs.readText(file),
			mtime: mtimeOf(file),
		}));

		mirrorService.syncMirrors(mirrorsRoot, [mirror]);
		fs.writeFile(mirrored("platforms", "android", "include.gradle"), "x");
		mirrorService.syncMirrors(mirrorsRoot, [mirror]);

		const after = fs.enumerateFilesInDirectorySync(packageDir).map((file) => ({
			file,
			content: fs.readText(file),
			mtime: mtimeOf(file),
		}));
		assert.deepStrictEqual(after, before);
	});
});
