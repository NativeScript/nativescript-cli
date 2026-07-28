const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

// Older checkouts compiled next to the sources; .gitignore is the source of
// truth for which files under src/ and test/ are leftover compiler output.
const result = child_process.spawnSync("git", ["clean", "-Xdf", "src", "test"], {
	cwd: rootDir,
	stdio: "inherit",
});

if (result.error) {
	throw result.error;
}

if (result.status !== 0) {
	throw new Error(`git clean exited with status ${result.status}`);
}

for (const dir of ["dist", "dist-test", "coverage"]) {
	fs.rmSync(path.join(rootDir, dir), { recursive: true, force: true });
}

for (const entry of fs.readdirSync(rootDir)) {
	if (entry.endsWith(".tgz")) {
		fs.rmSync(path.join(rootDir, entry));
	}
}
