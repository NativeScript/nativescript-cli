const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

// The tests resolve fixtures relative to __dirname, so they have to sit next to
// the compiled test files rather than in the source tree.
fs.cpSync(path.join(rootDir, "test"), path.join(rootDir, "dist-test", "test"), {
	recursive: true,
	filter: (src) => !src.endsWith(".ts"),
});
