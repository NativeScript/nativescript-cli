const fs = require("fs");
const path = require("path");
const _ = require("lodash");

const rootDir = path.join(__dirname, "..");
const sourceDir = path.join(rootDir, "docs", "man_pages");
const outputDir = path.join(rootDir, "docs-cli");

const templateData = {
  isJekyll: true,
  isHtml: true,
  isConsole: true,
  isWindows: true,
  isMacOS: true,
  isLinux: true,
  constants: "",
};

function* markdownFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* markdownFiles(entryPath);
    } else if (entry.name.endsWith(".md")) {
      yield entryPath;
    }
  }
}

// output from a man page that was since deleted or renamed would otherwise
// linger and ship as stale documentation
fs.rmSync(outputDir, { recursive: true, force: true });

for (const sourcePath of markdownFiles(sourceDir)) {
  const outputPath = path.join(
    outputDir,
    path.relative(sourceDir, sourcePath)
  );

  let rendered;
  try {
    rendered = _.template(fs.readFileSync(sourcePath, "utf8"))(templateData);
  } catch (err) {
    throw new Error(
      `Failed to render ${path.relative(rootDir, sourcePath)}: ${err.message}`
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rendered);
}
