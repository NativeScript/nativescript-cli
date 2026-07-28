const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

// .gitignore is the source of truth for which files under lib/ and test/ are
// compiler output: its negations already protect the vendored, hook and fixture
// .js files that must survive a clean.
const result = child_process.spawnSync("git", ["clean", "-Xdf", "lib", "test"], {
  cwd: rootDir,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`git clean exited with status ${result.status}`);
}

for (const entry of fs.readdirSync(rootDir)) {
  if (entry.endsWith(".tgz")) {
    fs.rmSync(path.join(rootDir, entry));
  }
}
