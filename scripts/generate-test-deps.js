const fs = require("fs");
const path = require("path");
const { manifest } = require("pacote");

const configsBasePath = path.join(__dirname, "..", "config");
const dependenciesPath = path.join(configsBasePath, "test-dependencies.json");
const generatedVersionFilePath = path.join(
  configsBasePath,
  "test-deps-versions-generated.json"
);

async function latestVersion(name) {
  // only fetches the package.json for the latest dist-tag
  const { version } = await manifest(name.toLowerCase(), {
    fullMetadata: false,
  });
  return version;
}

async function main() {
  const testDependencies = JSON.parse(
    fs.readFileSync(dependenciesPath, "utf8")
  );

  const dependenciesVersions = {};
  for (const dep of testDependencies) {
    dependenciesVersions[dep.name] = dep.version || (await latestVersion(dep.name));
  }

  fs.writeFileSync(
    generatedVersionFilePath,
    JSON.stringify(dependenciesVersions, null, 2)
  );

  console.log("Wrote", generatedVersionFilePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
