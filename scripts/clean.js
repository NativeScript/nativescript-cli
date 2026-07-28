const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

fs.rmSync(path.join(rootDir, "dist"), { recursive: true, force: true });

// tsc never removes output whose source is gone, so every build starts from an
// empty dist - otherwise a deleted file keeps being compiled-in and tested
// against, which is the failure this whole layout exists to prevent.
if (process.argv.includes("--dist-only")) {
  process.exit(0);
}

// Builds used to emit next to each source file, so a tree that predates dist/
// still has hundreds of stale .js lying around. .gitignore is the source of
// truth for which of those are compiler output - its negations protect the
// vendored, hook and fixture .js that must survive.
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
