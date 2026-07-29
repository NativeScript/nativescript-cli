const fs = require("fs");
const path = require("path");

// dist/ is assembled as a complete package root, not just compiled output:
// lib/ resolves siblings through __dirname (../package.json, ../docs/helpers,
// ../../vendor/gradle-plugin, ...), so those directories have to sit next to it
// exactly as they do in the repo.

const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const release = process.argv.includes("--release");

// bundleDependencies are resolved from node_modules next to the manifest being
// packed, so they have to be mirrored into dist for `npm pack` to bundle them
const BUNDLED = ["universal-analytics", "debug", "ms", "uuid"];

const SIBLING_DIRS = ["resources", "docs", "config", "vendor", "bin", "setup"];
// npm picks README/LICENSE/CHANGELOG up from the directory being packed, so
// they have to exist inside dist or they silently drop out of the tarball
const ROOT_FILES = [
	"postinstall.js",
	"preuninstall.js",
	"README.md",
	"LICENSE",
	"CHANGELOG.md",
];

// paths (relative to the repo root) that never ship
const RELEASE_EXCLUDES = [
	path.join("docs", "html"),
	path.join("lib", "common", "docs", "fonts"),
	path.join("lib", "common", "test"),
];

function isExcluded(relPath) {
	if (!release) {
		return false;
	}
	return RELEASE_EXCLUDES.some(
		(excluded) => relPath === excluded || relPath.startsWith(excluded + path.sep)
	);
}

let copied = 0;
let skipped = 0;

function copyFile(sourcePath, targetPath) {
	const source = fs.statSync(sourcePath);
	if (fs.existsSync(targetPath)) {
		const target = fs.statSync(targetPath);
		if (target.mtimeMs >= source.mtimeMs && target.size === source.size) {
			skipped++;
			return;
		}
	}
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.copyFileSync(sourcePath, targetPath);
	copied++;
}

function copyTree(relDir, filter) {
	const sourceDir = path.join(rootDir, relDir);
	if (!fs.existsSync(sourceDir)) {
		return;
	}

	for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
		const relPath = path.join(relDir, entry.name);
		if (isExcluded(relPath)) {
			continue;
		}
		if (entry.isDirectory()) {
			copyTree(relPath, filter);
		} else if (!filter || filter(relPath)) {
			copyFile(path.join(rootDir, relPath), path.join(distDir, relPath));
		}
	}
}

// Everything under lib/ that is not TypeScript is an asset: vendored scripts,
// hooks, platform-tools binaries, docs helpers and test fixtures. A .js with a
// sibling .ts is compiler output instead - either left over from the old
// in-place build or freshly emitted into dist - and copying it would overwrite
// what tsc just produced.
function isCompilerOutput(relPath) {
	const stem = relPath.replace(/\.js\.map$/, "").replace(/\.js$/, "");
	return (
		(relPath.endsWith(".js") || relPath.endsWith(".js.map")) &&
		fs.existsSync(path.join(rootDir, stem + ".ts"))
	);
}

// Hand-written .d.ts come along too. tsc treats them as inputs and never emits
// them, but the generated declarations import from them, so leaving them behind
// ships types with dangling references.
copyTree(
	"lib",
	(relPath) =>
		(!relPath.endsWith(".ts") || relPath.endsWith(".d.ts")) &&
		!isCompilerOutput(relPath)
);

for (const dir of SIBLING_DIRS) {
	copyTree(dir);
}

if (!release) {
	// fixtures the compiled tests read relative to their own location
	copyTree(path.join("test", "files"));
}

for (const file of ROOT_FILES) {
	copyFile(path.join(rootDir, file), path.join(distDir, file));
}

for (const dep of BUNDLED) {
	copyTree(path.join("node_modules", dep));
}

writeManifest();

function writeManifest() {
	const pkg = JSON.parse(
		fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
	);

	// dist is the package root once published, so entrypoints lose the dist/
	// prefix they carry in the source manifest
	pkg.main = pkg.main.replace(/^\.\/dist\//, "./");

	delete pkg.devDependencies;
	delete pkg.files;
	delete pkg.overrides;
	delete pkg["lint-staged"];

	pkg.scripts = {
		postinstall: pkg.scripts.postinstall,
		preuninstall: pkg.scripts.preuninstall,
	};

	fs.writeFileSync(
		path.join(distDir, "package.json"),
		JSON.stringify(pkg, null, 2) + "\n"
	);
}

console.log(
	`assets: ${copied} copied, ${skipped} up to date${release ? " (release)" : ""}`
);
