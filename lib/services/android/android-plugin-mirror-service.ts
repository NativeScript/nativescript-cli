import * as path from "path";
import { createHash } from "crypto";
import { IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import {
	IAndroidPluginMirror,
	IAndroidPluginMirrorService,
} from "../../definitions/android-plugin-migrator";
import { PACKAGE_JSON_FILE_NAME, PLATFORMS_DIR_NAME } from "../../constants";

interface IMirroredFile {
	sha1: string;
}

interface IMirrorManifest {
	files: { [relativePath: string]: IMirroredFile };
}

const MIRROR_MANIFEST_FILE_NAME = ".ns-mirror.json";
const NATIVE_DIR = `${PLATFORMS_DIR_NAME}/android`;

/**
 * Keeps CLI-owned copies of plugins' Android files so prepare and build never
 * write into node_modules.
 *
 * The manifest records the upstream content of every copied file. Mirror
 * files are compared against it rather than against their own content because
 * the CLI rewrites some of them (include.gradle) and adds its own (the built
 * aar). Copies keep the upstream mtime, and files whose upstream content is
 * unchanged are never rewritten, so Gradle's path and mtime based inputs stay
 * up to date across syncs.
 */
export class AndroidPluginMirrorService implements IAndroidPluginMirrorService {
	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
	) {}

	public syncMirrors(
		mirrorsRoot: string,
		mirrors: IAndroidPluginMirror[],
	): string[] {
		this.removeUnknownMirrors(mirrorsRoot, mirrors);

		return mirrors
			.filter((mirror) => this.syncMirror(mirror))
			.map((mirror) => mirror.pluginName);
	}

	private removeUnknownMirrors(
		mirrorsRoot: string,
		mirrors: IAndroidPluginMirror[],
	): void {
		if (!this.$fs.exists(mirrorsRoot)) {
			return;
		}

		const knownDirs = new Set(
			mirrors.map((mirror) => path.resolve(mirror.mirrorDir)),
		);
		for (const entry of this.$fs.readDirectory(mirrorsRoot)) {
			const entryPath = path.join(mirrorsRoot, entry);
			if (!knownDirs.has(path.resolve(entryPath))) {
				this.$logger.trace(`Removing unused plugin mirror ${entryPath}`);
				this.$fs.deleteDirectory(entryPath);
			}
		}
	}

	private syncMirror(mirror: IAndroidPluginMirror): boolean {
		const manifestPath = path.join(mirror.mirrorDir, MIRROR_MANIFEST_FILE_NAME);
		const previous = this.readManifest(manifestPath);
		const next: IMirrorManifest = { files: {} };
		const excluded = new Set(
			(mirror.excludedNativeFiles ?? []).map(
				(file) => `${NATIVE_DIR}/${toPosix(file)}`,
			),
		);
		let changed = false;

		for (const relativePath of this.getUpstreamFiles(mirror.packageDir)) {
			if (excluded.has(relativePath)) {
				continue;
			}

			const source = path.join(mirror.packageDir, relativePath);
			const destination = path.join(mirror.mirrorDir, relativePath);
			const stat = this.$fs.getFsStats(source);
			const known = previous.files[relativePath];
			// Always hashed: some installers give every file the same fixed mtime, so a
			// same-size edit (a version bump in include.gradle) would look unchanged.
			const sha1 = this.getSha1(source);

			if (!known || known.sha1 !== sha1 || !this.$fs.exists(destination)) {
				this.$fs.deleteFile(destination);
				this.$fs.copyFile(source, destination);
				// Read-only stores (pnpm, Nix, Bazel) ship 0444 files; the CLI rewrites
				// some mirrored files and replaces others on the next sync.
				this.$fs.chmod(destination, stat.mode | 0o200);
				this.$fs.utimes(destination, stat.atime, stat.mtime);
				changed = true;
			}

			next.files[relativePath] = { sha1 };
		}

		for (const relativePath of Object.keys(previous.files)) {
			if (!next.files[relativePath]) {
				this.deleteMirroredFile(mirror.mirrorDir, relativePath);
				changed = true;
			}
		}

		const manifestContent = JSON.stringify(next, null, "\t");
		if (
			!this.$fs.exists(manifestPath) ||
			this.$fs.readText(manifestPath) !== manifestContent
		) {
			this.$fs.writeFile(manifestPath, manifestContent);
		}

		return changed;
	}

	private getUpstreamFiles(packageDir: string): string[] {
		const files: string[] = [];
		if (this.$fs.exists(path.join(packageDir, PACKAGE_JSON_FILE_NAME))) {
			files.push(PACKAGE_JSON_FILE_NAME);
		}

		const nativeDir = path.join(packageDir, NATIVE_DIR);
		if (this.$fs.exists(nativeDir)) {
			for (const file of this.$fs.enumerateFilesInDirectorySync(nativeDir)) {
				files.push(toPosix(path.relative(packageDir, file)));
			}
		}

		return files.sort();
	}

	private deleteMirroredFile(mirrorDir: string, relativePath: string): void {
		const filePath = path.join(mirrorDir, relativePath);
		this.$fs.deleteFile(filePath);

		const root = path.resolve(mirrorDir);
		let dir = path.dirname(path.resolve(filePath));
		while (
			dir !== root &&
			dir.startsWith(root) &&
			this.$fs.exists(dir) &&
			this.$fs.isEmptyDir(dir)
		) {
			this.$fs.deleteDirectory(dir);
			dir = path.dirname(dir);
		}
	}

	private readManifest(manifestPath: string): IMirrorManifest {
		try {
			if (this.$fs.exists(manifestPath)) {
				const manifest = this.$fs.readJson(manifestPath);
				if (manifest && manifest.files) {
					return manifest;
				}
			}
		} catch (err) {
			this.$logger.trace(
				`Ignoring unreadable plugin mirror manifest ${manifestPath}: ${err}`,
			);
		}

		return { files: {} };
	}

	private getSha1(filePath: string): string {
		return createHash("sha1").update(this.$fs.readFile(filePath)).digest("hex");
	}
}

function toPosix(filePath: string): string {
	return filePath.split(path.sep).join("/");
}

injector.register("androidPluginMirrorService", AndroidPluginMirrorService);
