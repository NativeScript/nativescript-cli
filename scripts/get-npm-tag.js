const semver = require("semver");

const currentVersion =
  process.env.NPM_VERSION || require("../package.json").version;

function validateNpmTag(version) {
  const parsed = semver.parse(version);
  return (
    parsed.prerelease.length === 0 || /^[a-zA-Z]+$/.test(parsed.prerelease[0])
  );
}

function getNpmTag(version) {
  if (!validateNpmTag(version)) throw new Error("Invalid npm tag");
  const parsed = semver.parse(version);
  return parsed.prerelease[0] || "latest";
}

console.log(getNpmTag(currentVersion));
